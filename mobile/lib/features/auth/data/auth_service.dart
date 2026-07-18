import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/dio_client.dart';
import 'auth_models.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(dio: ref.watch(dioProvider));
});

class AuthService {
  final Dio dio;
  AuthService({required this.dio});

  Future<LoginResponse> login(String username, String password) async {
    final response = await dio.post('/auth/login', data: LoginRequest(username: username, password: password).toJson());
    return LoginResponse.fromJson(response.data);
  }

  Future<LoginResponse> refreshToken(String refreshToken) async {
    final response = await dio.post('/auth/refresh', data: RefreshTokenRequest(refreshToken: refreshToken).toJson());
    return LoginResponse.fromJson(response.data);
  }

  Future<UsuarioDTO> getMe() async {
    final response = await dio.get('/auth/me');
    return UsuarioDTO.fromJson(response.data);
  }

  Future<void> logout() async {
    try {
      await dio.post('/auth/logout');
    } catch (_) {}
  }
}
