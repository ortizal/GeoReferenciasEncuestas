class AppConstants {
  AppConstants._();

  static const String appName = 'ALANTEK GeoRef';
  static const String defaultBaseUrl = 'http://10.0.2.2:8080/api';
  static const String tokenKey = 'jwt_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String baseUrlKey = 'base_url';
  static const String userKey = 'current_user';
  static const String syncEnabledKey = 'sync_enabled';
  static const String lastSyncKey = 'last_sync';

  static const int tokenRefreshBefore = 300;
  static const Duration syncInterval = Duration(minutes: 15);
  static const int maxRetryAttempts = 3;
}
