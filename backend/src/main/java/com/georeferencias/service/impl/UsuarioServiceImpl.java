package com.georeferencias.service.impl;

import com.georeferencias.dto.UsuarioDTO;
import com.georeferencias.entity.Grupo;
import com.georeferencias.entity.Rol;
import com.georeferencias.entity.Usuario;
import com.georeferencias.enums.EstadoUsuario;
import com.georeferencias.exception.BadRequestException;
import com.georeferencias.exception.ResourceNotFoundException;
import com.georeferencias.repository.GrupoRepository;
import com.georeferencias.repository.RolRepository;
import com.georeferencias.repository.UsuarioRepository;
import com.georeferencias.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final GrupoRepository grupoRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UsuarioDTO crear(UsuarioDTO dto) {
        if (usuarioRepository.existsByUsername(dto.getUsername())) {
            throw new BadRequestException("Ya existe un usuario con el username: " + dto.getUsername());
        }
        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Ya existe un usuario con el email: " + dto.getEmail());
        }

        String rawPassword = dto.getPassword() != null ? dto.getPassword() : "123456";

        Usuario usuario = Usuario.builder()
                .username(dto.getUsername())
                .password(passwordEncoder.encode(rawPassword))
                .nombre(dto.getNombre())
                .apellido(dto.getApellido())
                .email(dto.getEmail())
                .telefono(dto.getTelefono())
                .estado(EstadoUsuario.ACTIVO)
                .primerLogin(true)
                .activo(true)
                .intentosFallidos(0)
                .fechaCreacion(LocalDateTime.now())
                .build();

        if (dto.getRoles() != null && !dto.getRoles().isEmpty()) {
            Set<Rol> roles = dto.getRoles().stream()
                    .map(nombre -> rolRepository.findByNombre(nombre)
                            .orElseThrow(() -> new BadRequestException("Rol no encontrado: " + nombre)))
                    .collect(Collectors.toSet());
            usuario.setRoles(roles);
        }

        usuario = usuarioRepository.save(usuario);

        if (dto.getGrupos() != null && !dto.getGrupos().isEmpty()) {
            Set<Grupo> grupos = new HashSet<>(grupoRepository.findAllById(dto.getGrupos()));
            usuario.setGrupos(grupos);
            usuario = usuarioRepository.save(usuario);
        }

        return mapToDTO(usuario);
    }

    @Override
    @Transactional
    public UsuarioDTO actualizar(Long id, UsuarioDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        if (!usuario.getUsername().equals(dto.getUsername()) && usuarioRepository.existsByUsername(dto.getUsername())) {
            throw new BadRequestException("Ya existe un usuario con el username: " + dto.getUsername());
        }
        if (!usuario.getEmail().equals(dto.getEmail()) && usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Ya existe un usuario con el email: " + dto.getEmail());
        }

        usuario.setNombre(dto.getNombre());
        usuario.setApellido(dto.getApellido());
        usuario.setUsername(dto.getUsername());
        usuario.setEmail(dto.getEmail());
        usuario.setTelefono(dto.getTelefono());

        if (dto.getActivo() != null) {
            usuario.setActivo(dto.getActivo());
            if (!dto.getActivo()) {
                usuario.setEstado(EstadoUsuario.INACTIVO);
            } else if (usuario.getEstado() == EstadoUsuario.INACTIVO) {
                usuario.setEstado(EstadoUsuario.ACTIVO);
            }
        }

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        if (dto.getRoles() != null) {
            Set<Rol> roles = dto.getRoles().stream()
                    .map(nombre -> rolRepository.findByNombre(nombre)
                            .orElseThrow(() -> new BadRequestException("Rol no encontrado: " + nombre)))
                    .collect(Collectors.toSet());
            usuario.setRoles(roles);
        }

        if (dto.getGrupos() != null) {
            Set<Grupo> grupos = new HashSet<>(grupoRepository.findAllById(dto.getGrupos()));
            usuario.setGrupos(grupos);
        }

        usuario = usuarioRepository.save(usuario);
        return mapToDTO(usuario);
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Usuario no encontrado");
        }
        usuarioRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioDTO obtenerPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        return mapToDTO(usuario);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UsuarioDTO> buscar(String busqueda, Boolean activo, Pageable pageable) {
        if (activo == null) activo = true;
        return usuarioRepository.buscarConFiltros(busqueda, activo, pageable).map(this::mapToDTO);
    }

    @Override
    @Transactional
    public UsuarioDTO bloquear(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        usuario.setEstado(EstadoUsuario.BLOQUEADO);
        usuario.setFechaBloqueo(LocalDateTime.now());
        usuario = usuarioRepository.save(usuario);
        return mapToDTO(usuario);
    }

    @Override
    @Transactional
    public UsuarioDTO desbloquear(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        usuario.setEstado(EstadoUsuario.ACTIVO);
        usuario.setIntentosFallidos(0);
        usuario.setFechaBloqueo(null);
        usuario = usuarioRepository.save(usuario);
        return mapToDTO(usuario);
    }

    @Override
    @Transactional
    public UsuarioDTO asignarGrupos(Long idUsuario, List<Long> idsGrupos) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Set<Grupo> grupos = new HashSet<>(grupoRepository.findAllById(idsGrupos));
        usuario.setGrupos(grupos);
        usuario = usuarioRepository.save(usuario);
        return mapToDTO(usuario);
    }

    private UsuarioDTO mapToDTO(Usuario usuario) {
        Set<String> roles = usuario.getRoles().stream()
                .map(Rol::getNombre)
                .collect(Collectors.toSet());

        Set<Long> grupos = usuario.getGrupos().stream()
                .map(Grupo::getIdGrupo)
                .collect(Collectors.toSet());

        return UsuarioDTO.builder()
                .idUsuario(usuario.getIdUsuario())
                .username(usuario.getUsername())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .email(usuario.getEmail())
                .telefono(usuario.getTelefono())
                .estado(usuario.getEstado().name())
                .primerLogin(usuario.getPrimerLogin())
                .activo(usuario.getActivo())
                .intentosFallidos(usuario.getIntentosFallidos())
                .fechaBloqueo(usuario.getFechaBloqueo())
                .ultimoAcceso(usuario.getUltimoAcceso())
                .fechaCreacion(usuario.getFechaCreacion())
                .roles(roles)
                .grupos(grupos)
                .build();
    }
}
