import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'core/theme/app_theme.dart';
import 'core/storage/local_storage.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/home/screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  final localStorage = LocalStorage();
  await localStorage.init();

  runApp(ProviderScope(
    overrides: [localStorageProvider.overrideWithValue(localStorage)],
    child: const GeoRefApp(),
  ));
}

class GeoRefApp extends ConsumerWidget {
  const GeoRefApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    return MaterialApp(
      title: 'ALANTEK GeoRef',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: auth.isAuthenticated ? const HomeScreen() : const LoginScreen(),
    );
  }
}
