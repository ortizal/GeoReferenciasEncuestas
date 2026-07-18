class LoginResponse {
  final String accessToken;
  final String refreshToken;
  final UsuarioDTO usuario;
  final List<String> roles;

  LoginResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.usuario,
    required this.roles,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      accessToken: json['accessToken'] ?? '',
      refreshToken: json['refreshToken'] ?? '',
      usuario: UsuarioDTO.fromJson(json['usuario'] ?? {}),
      roles: List<String>.from(json['roles'] ?? []),
    );
  }
}

class UsuarioDTO {
  final int id;
  final String username;
  final String nombre;
  final String email;
  final String telefono;
  final String? grupo;
  final int? grupoId;
  final bool activo;

  UsuarioDTO({
    required this.id,
    required this.username,
    required this.nombre,
    required this.email,
    this.telefono = '',
    this.grupo,
    this.grupoId,
    this.activo = true,
  });

  factory UsuarioDTO.fromJson(Map<String, dynamic> json) {
    return UsuarioDTO(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      nombre: json['nombre'] ?? '',
      email: json['email'] ?? '',
      telefono: json['telefono'] ?? '',
      grupo: json['grupo'],
      grupoId: json['grupoId'],
      activo: json['activo'] ?? true,
    );
  }

  bool get isVisitador => true;
}

class RefreshTokenRequest {
  final String refreshToken;
  RefreshTokenRequest({required this.refreshToken});
  Map<String, dynamic> toJson() => {'refreshToken': refreshToken};
}

class LoginRequest {
  final String username;
  final String password;
  LoginRequest({required this.username, required this.password});
  Map<String, dynamic> toJson() => {'username': username, 'password': password};
}
