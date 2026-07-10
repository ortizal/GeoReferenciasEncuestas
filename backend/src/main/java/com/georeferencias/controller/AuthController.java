package com.georeferencias.controller;

import com.georeferencias.dto.*;
import com.georeferencias.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Endpoints de autenticación y seguridad")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "Autentica un usuario y retorna tokens JWT")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.exito(response, "Inicio de sesión exitoso"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renovar token", description = "Renueva el access token usando el refresh token")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.exito(response, "Token renovado exitosamente"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesión", description = "Invalida el token actual")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            authService.logout(authHeader.substring(7));
        }
        return ResponseEntity.ok(ApiResponse.exito(null, "Sesión cerrada exitosamente"));
    }

    @PostMapping("/cambio-contrasena")
    @Operation(summary = "Cambiar contraseña", description = "Cambia la contraseña del usuario autenticado")
    public ResponseEntity<ApiResponse<Void>> cambioContrasena(
            Authentication authentication,
            @Valid @RequestBody CambioContrasenaRequest request) {
        authService.cambioContrasena(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.exito(null, "Contraseña cambiada exitosamente"));
    }

    @PostMapping("/recuperar-contrasena")
    @Operation(summary = "Recuperar contraseña", description = "Envía un email de recuperación de contraseña")
    public ResponseEntity<ApiResponse<Void>> recuperarContrasena(@RequestParam String email) {
        authService.recuperarContrasena(email);
        return ResponseEntity.ok(ApiResponse.exito(null, "Se envió un email de recuperación"));
    }

    @GetMapping("/me")
    @Operation(summary = "Obtener usuario actual", description = "Retorna la información del usuario autenticado")
    public ResponseEntity<ApiResponse<UsuarioDTO>> getUsuarioActual(Authentication authentication) {
        var usuario = authService.getUsuarioActual(authentication.getName());
        UsuarioDTO dto = UsuarioDTO.builder()
                .idUsuario(usuario.getIdUsuario())
                .username(usuario.getUsername())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .email(usuario.getEmail())
                .telefono(usuario.getTelefono())
                .build();
        return ResponseEntity.ok(ApiResponse.exito(dto, "Usuario obtenido"));
    }
}
