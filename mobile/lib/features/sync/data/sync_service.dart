import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../../../core/storage/local_storage.dart';
import '../../dashboard/data/assignment_service.dart';
import '../../visitas/data/visita_model.dart';

final syncProvider = StateNotifierProvider<SyncNotifier, SyncState>((ref) {
  return SyncNotifier(
    service: ref.watch(assignmentServiceProvider),
    storage: ref.watch(localStorageProvider),
  );
});

class SyncState {
  final bool isSyncing;
  final int pendingSync;
  final DateTime? lastSync;
  final String? error;

  SyncState({
    this.isSyncing = false,
    this.pendingSync = 0,
    this.lastSync,
    this.error,
  });
}

class SyncNotifier extends StateNotifier<SyncState> {
  final AssignmentService _service;
  final LocalStorage _storage;
  late Box _pendingBox;

  SyncNotifier({required AssignmentService service, required LocalStorage storage})
      : _service = service,
        _storage = storage,
        super(SyncState()) {
    _init();
  }

  Future<void> _init() async {
    _pendingBox = await Hive.openBox('pending_visits');
    state = SyncState(pendingSync: _pendingBox.length);
  }

  Future<void> syncNow() async {
    if (state.isSyncing || _pendingBox.isEmpty) return;
    state = SyncState(isSyncing: true, pendingSync: _pendingBox.length);

    try {
      final keys = _pendingBox.keys.toList();
      int synced = 0;
      for (final key in keys) {
        try {
          final data = Map<String, dynamic>.from(_pendingBox.get(key));
          final visita = VisitaDTO.fromJson(data);
          await _service.createVisita(visita);
          await _pendingBox.delete(key);
          synced++;
        } catch (_) {}
      }
      await _storage.saveLastSync(DateTime.now());
      state = SyncState(pendingSync: _pendingBox.length, lastSync: DateTime.now());
    } catch (e) {
      state = SyncState(pendingSync: _pendingBox.length, error: 'Error en sincronizacion');
    }
  }

  Future<void> savePendingVisita(VisitaDTO visita) async {
    final key = DateTime.now().millisecondsSinceEpoch.toString();
    await _pendingBox.put(key, visita.toJson());
    state = SyncState(pendingSync: _pendingBox.length, lastSync: state.lastSync);
  }

  Future<void> clearAll() async {
    await _pendingBox.clear();
    state = SyncState(pendingSync: 0, lastSync: state.lastSync);
  }
}
