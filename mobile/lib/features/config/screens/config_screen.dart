import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/storage/local_storage.dart';
import '../../auth/providers/auth_provider.dart';

class ConfigScreen extends ConsumerStatefulWidget {
  const ConfigScreen({super.key});

  @override
  ConsumerState<ConfigScreen> createState() => _ConfigScreenState();
}

class _ConfigScreenState extends ConsumerState<ConfigScreen> {
  late TextEditingController _baseUrlCtrl;
  bool _syncEnabled = true;

  @override
  void initState() {
    super.initState();
    final storage = ref.read(localStorageProvider);
    _baseUrlCtrl = TextEditingController(text: storage.getBaseUrl());
    _syncEnabled = storage.getSyncEnabled();
  }

  @override
  void dispose() {
    _baseUrlCtrl.dispose();
    super.dispose();
  }

  void _saveBaseUrl() async {
    final storage = ref.read(localStorageProvider);
    await storage.saveBaseUrl(_baseUrlCtrl.text.trim());
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('URL del servidor actualizada'), backgroundColor: AppTheme.positivo),
      );
    }
  }

  void _toggleSync(bool value) async {
    final storage = ref.read(localStorageProvider);
    await storage.saveSyncSettings(enabled: value);
    setState(() => _syncEnabled = value);
  }

  void _logout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cerrar Sesion'),
        content: const Text('Estas seguro de que deseas cerrar sesion?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
            },
            child: const Text('Cerrar Sesion', style: TextStyle(color: AppTheme.negativo)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Configuracion')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // User info
          Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: AppTheme.primary,
                child: Text(
                  (auth.user?.nombre ?? 'U')[0].toUpperCase(),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
              title: Text(auth.user?.nombre ?? 'Usuario'),
              subtitle: Text(auth.user?.username ?? ''),
            ),
          ),
          const SizedBox(height: 16),

          // API URL
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Servidor API', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _baseUrlCtrl,
                          decoration: const InputDecoration(hintText: 'URL del servidor'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        onPressed: _saveBaseUrl,
                        icon: const Icon(Icons.save, color: AppTheme.primary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('Default: ${AppConstants.defaultBaseUrl}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Sync settings
          Card(
            child: SwitchListTile(
              title: const Text('Sincronizacion automatica'),
              subtitle: const Text('Sincronizar datos cada 15 minutos'),
              value: _syncEnabled,
              onChanged: _toggleSync,
              secondary: const Icon(Icons.sync),
            ),
          ),
          const SizedBox(height: 16),

          // App info
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Informacion', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  _infoRow('App', AppConstants.appName),
                  _infoRow('Version', '1.0.0'),
                  _infoRow('Rol', 'VISITADOR'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Logout
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _logout,
              icon: const Icon(Icons.logout, color: AppTheme.negativo),
              label: const Text('Cerrar Sesion', style: TextStyle(color: AppTheme.negativo)),
              style: OutlinedButton.styleFrom(side: const BorderSide(color: AppTheme.negativo)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text('$label: ', style: const TextStyle(color: AppTheme.textSecondary)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
