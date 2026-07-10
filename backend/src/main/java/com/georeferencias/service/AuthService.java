package com.georeferencias.service;

import com.georeferencias.dto.*;
import com.georeferencias.entity.Usuario;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    LoginResponse refreshToken(RefreshTokenRequest request);
    void logout(String token);
    void cambioContrasena(String username, CambioContrasenaRequest request);
    void recuperarContrasena(String email);
    Usuario getUsuarioActual(String username);
}
