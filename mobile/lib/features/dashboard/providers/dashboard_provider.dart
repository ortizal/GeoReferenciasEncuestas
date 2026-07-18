import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/assignment_service.dart';
import '../data/manzana_model.dart';
import '../data/predio_model.dart';

final dashboardProvider = StateNotifierProvider<DashboardNotifier, DashboardState>((ref) {
  return DashboardNotifier(ref.watch(assignmentServiceProvider));
});

class DashboardState {
  final bool isLoading;
  final List<ManzanaDTO> manzanas;
  final List<PredioDTO> predios;
  final String? error;

  DashboardState({
    this.isLoading = false,
    this.manzanas = const [],
    this.predios = const [],
    this.error,
  });

  DashboardState copyWith({bool? isLoading, List<ManzanaDTO>? manzanas, List<PredioDTO>? predios, String? error}) {
    return DashboardState(
      isLoading: isLoading ?? this.isLoading,
      manzanas: manzanas ?? this.manzanas,
      predios: predios ?? this.predios,
      error: error,
    );
  }

  int get totalPredios => predios.length;
  int get prediosVisitados => predios.where((p) => p.estadoVisita != null && p.estadoVisita != 'EN_BLANCO').length;
  int get prediosPositivos => predios.where((p) => p.estadoVisita == 'POSITIVO').length;
  int get prediosNegativos => predios.where((p) => p.estadoVisita == 'NEGATIVO').length;
  int get prediosIndecisos => predios.where((p) => p.estadoVisita == 'INDECISO').length;
}

class DashboardNotifier extends StateNotifier<DashboardState> {
  final AssignmentService _service;

  DashboardNotifier(this._service) : super(DashboardState());

  Future<void> loadData() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final manzanasFuture = _service.getManzanas();
      final prediosFuture = _service.getPredios();
      final manzanas = await manzanasFuture;
      final predios = await prediosFuture;
      state = state.copyWith(isLoading: false, manzanas: manzanas, predios: predios);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Error al cargar datos');
    }
  }
}
