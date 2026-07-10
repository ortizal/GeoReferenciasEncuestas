package com.georeferencias.service.impl;

import com.georeferencias.dto.*;
import com.georeferencias.entity.Usuario;
import com.georeferencias.enums.EstadoUsuario;
import com.georeferencias.exception.BadRequestException;
import com.georeferencias.exception.ResourceNotFoundException;
import com.georeferencias.repository.UsuarioRepository;
import com.georeferencias.security.JwtTokenProvider;
import com.georeferencias.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadRequestException("Credenciales incorrectas"));

        if (EstadoUsuario.BLOQUEADO.equals(usuario.getEstado())) {
            throw new BadRequestException("La cuenta está bloqueada. Contacte al administrador.");
        }

        if (!usuario.getActivo()) {
            throw new BadRequestException("La cuenta está desactivada.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(), request.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String accessToken = tokenProvider.generateToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(request.getUsername());

            usuario.setIntentosFallidos(0);
            usuario.setUltimoAcceso(LocalDateTime.now());
            usuarioRepository.save(usuario);

            Set<String> roles = usuario.getRoles().stream()
                    .map(rol -> rol.getNombre())
                    .collect(Collectors.toSet());

            UsuarioDTO usuarioDTO = UsuarioDTO.builder()
                    .idUsuario(usuario.getIdUsuario())
                    .username(usuario.getUsername())
                    .nombre(usuario.getNombre())
                    .apellido(usuario.getApellido())
                    .email(usuario.getEmail())
                    .roles(roles)
                    .primerLogin(usuario.getPrimerLogin())
                    .build();

            return LoginResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .expiresIn(tokenProvider.getJwtExpiration())
                    .usuario(usuarioDTO)
                    .roles(roles)
                    .build();

        } catch (Exception e) {
            usuario.setIntentosFallidos(usuario.getIntentosFallidos() + 1);
            if (usuario.getIntentosFallidos() >= 5) {
                usuario.setEstado(EstadoUsuario.BLOQUEADO);
                usuario.setFechaBloqueo(LocalDateTime.now());
            }
            usuarioRepository.save(usuario);
            throw new BadRequestException("Credenciales incorrectas");
        }
    }

    @Override
    @Transactional
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        if (!tokenProvider.validateToken(request.getRefreshToken())) {
            throw new BadRequestException("Refresh token inválido o expirado");
        }

        String username = tokenProvider.getUsernameFromToken(request.getRefreshToken());
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        String newAccessToken = tokenProvider.generateToken(username);
        String newRefreshToken = tokenProvider.generateRefreshToken(username);

        Set<String> roles = usuario.getRoles().stream()
                .map(rol -> rol.getNombre())
                .collect(Collectors.toSet());

        UsuarioDTO usuarioDTO = UsuarioDTO.builder()
                .idUsuario(usuario.getIdUsuario())
                .username(usuario.getUsername())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .email(usuario.getEmail())
                .roles(roles)
                .build();

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getJwtExpiration())
                .usuario(usuarioDTO)
                .roles(roles)
                .build();
    }

    @Override
    @Transactional
    public void logout(String token) {
        // En una implementación completa, se agregaría el token a una lista negra
    }

    @Override
    @Transactional
    public void cambioContrasena(String username, CambioContrasenaRequest request) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        if (!passwordEncoder.matches(request.getContrasenaActual(), usuario.getPassword())) {
            throw new BadRequestException("La contraseña actual es incorrecta");
        }

        if (!request.getNuevaContrasena().equals(request.getConfirmarContrasena())) {
            throw new BadRequestException("Las contraseñas no coinciden");
        }

        usuario.setPassword(passwordEncoder.encode(request.getNuevaContrasena()));
        usuario.setPrimerLogin(false);
        usuarioRepository.save(usuario);
    }

    @Override
    @Transactional
    public void recuperarContrasena(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró una cuenta con ese email"));

        // En una implementación completa, se enviaría un email con un token de recuperación
        // Por ahora solo validamos que el email existe
    }

    @Override
    @Transactional(readOnly = true)
    public Usuario getUsuarioActual(String username) {
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }
}
