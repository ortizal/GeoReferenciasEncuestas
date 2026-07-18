import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/local_storage.dart';
import '../../features/auth/data/auth_models.dart';

final dioProvider = Provider<Dio>((ref) {
  final storage = ref.watch(localStorageProvider);
  return DioClient(storage: storage).dio;
});

class DioClient {
  final LocalStorage _storage;
  late final Dio dio;

  DioClient({required LocalStorage storage}) : _storage = storage {
    dio = Dio(BaseOptions(
      baseUrl: _storage.getBaseUrl(),
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    dio.interceptors.add(AuthInterceptor(_storage, dio));
    dio.interceptors.add(LogInterceptor(requestBody: true, responseBody: true));
  }
}

class AuthInterceptor extends Interceptor {
  final LocalStorage _storage;
  final Dio _dio;
  bool _isRefreshing = false;

  AuthInterceptor(this._storage, this._dio);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = _storage.getToken();
    if (token != null && !options.path.contains('/auth/login')) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 && !_isRefreshing) {
      _isRefreshing = true;
      try {
        final refreshToken = _storage.getRefreshToken();
        if (refreshToken != null) {
          final response = await _dio.post('/auth/refresh',
              data: RefreshTokenRequest(refreshToken: refreshToken).toJson());
          final loginResp = LoginResponse.fromJson(response.data);
          await _storage.saveTokens(loginResp.accessToken, loginResp.refreshToken);
          err.requestOptions.headers['Authorization'] = 'Bearer ${loginResp.accessToken}';
          final retryResponse = await _dio.fetch(err.requestOptions);
          _isRefreshing = false;
          return handler.resolve(retryResponse);
        }
      } catch (e) {
        await _storage.clearAll();
      }
      _isRefreshing = false;
    }
    handler.next(err);
  }
}
