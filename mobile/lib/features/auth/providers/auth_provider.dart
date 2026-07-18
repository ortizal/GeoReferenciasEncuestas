import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/storage/local_storage.dart';
import '../data/auth_models.dart';
import '../data/auth_service.dart';

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    authService: ref.watch(authServiceProvider),
    storage: ref.watch(localStorageProvider),
  );
});

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final UsuarioDTO? user;
  final String? error;

  AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.error,
  });

  AuthState copyWith({bool? isLoading, bool? isAuthenticated, UsuarioDTO? user, String? error, bool clearError = false}) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final LocalStorage _storage;

  AuthNotifier({required AuthService authService, required LocalStorage storage})
      : _authService = authService,
        _storage = storage,
        super(AuthState()) {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    if (_storage.isLoggedIn) {
      state = state.copyWith(isLoading: true);
      try {
        final user = await _authService.getMe();
        state = state.copyWith(isLoading: false, isAuthenticated: true, user: user);
      } catch (e) {
        await _storage.clearAll();
        state = AuthState();
      }
    }
  }

  Future<void> login(String username, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _authService.login(username, password);
      final isVisitador = response.roles.any((r) => r.toUpperCase() == 'VISITADOR');
      if (!isVisitador) {
        state = state.copyWith(isLoading: false, error: 'Solo los visitadores pueden acceder desde la app móvil');
        return;
      }
      await _storage.saveTokens(response.accessToken, response.refreshToken);
      state = state.copyWith(isLoading: false, isAuthenticated: true, user: response.usuario);
    } catch (e) {
      String message = 'Error al iniciar sesion';
      if (e is DioException) {
        if (e.response?.statusCode == 401) message = 'Credenciales incorrectas';
        else if (e.response?.statusCode == 400) message = 'Credenciales incorrectas';
        else if (e.type == DioExceptionType.connectionTimeout) message = 'Sin conexion al servidor';
      }
      state = state.copyWith(isLoading: false, error: message);
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    await _storage.clearAll();
    state = AuthState();
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}
