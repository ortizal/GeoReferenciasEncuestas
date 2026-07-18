import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/app_constants.dart';

final localStorageProvider = Provider<LocalStorage>((ref) => LocalStorage());

class LocalStorage {
  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  String getToken() => _prefs?.getString(AppConstants.tokenKey) ?? '';
  String getRefreshToken() => _prefs?.getString(AppConstants.refreshTokenKey) ?? '';
  String getBaseUrl() => _prefs?.getString(AppConstants.baseUrlKey) ?? AppConstants.defaultBaseUrl;
  bool getSyncEnabled() => _prefs?.getBool(AppConstants.syncEnabledKey) ?? true;
  String? getLastSync() => _prefs?.getString(AppConstants.lastSyncKey);

  Future<void> saveTokens(String token, String refreshToken) async {
    await _prefs?.setString(AppConstants.tokenKey, token);
    await _prefs?.setString(AppConstants.refreshTokenKey, refreshToken);
  }

  Future<void> saveBaseUrl(String url) async {
    await _prefs?.setString(AppConstants.baseUrlKey, url);
  }

  Future<void> saveSyncSettings({required bool enabled}) async {
    await _prefs?.setBool(AppConstants.syncEnabledKey, enabled);
  }

  Future<void> saveLastSync(DateTime date) async {
    await _prefs?.setString(AppConstants.lastSyncKey, date.toIso8601String());
  }

  bool get isLoggedIn => getToken().isNotEmpty;

  Future<void> clearAll() async {
    await _prefs?.remove(AppConstants.tokenKey);
    await _prefs?.remove(AppConstants.refreshTokenKey);
  }
}
