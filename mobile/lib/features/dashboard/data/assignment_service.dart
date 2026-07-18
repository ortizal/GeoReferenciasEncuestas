import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/dio_client.dart';
import '../../dashboard/data/manzana_model.dart';
import '../../dashboard/data/predio_model.dart';
import '../../visitas/data/visita_model.dart';

final assignmentServiceProvider = Provider<AssignmentService>((ref) {
  return AssignmentService(dio: ref.watch(dioProvider));
});

class AssignmentService {
  final Dio dio;
  AssignmentService({required this.dio});

  Future<List<ManzanaDTO>> getManzanas() async {
    final response = await dio.get('/mi-assignment/manzanas');
    final data = response.data;
    final List items = data is Map && data['content'] != null ? data['content'] : (data is List ? data : []);
    return items.map<ManzanaDTO>((m) => ManzanaDTO.fromJson(m)).toList();
  }

  Future<List<PredioDTO>> getPredios() async {
    final response = await dio.get('/mi-assignment/predios');
    final data = response.data;
    final List items = data is Map && data['content'] != null ? data['content'] : (data is List ? data : []);
    return items.map<PredioDTO>((p) => PredioDTO.fromJson(p)).toList();
  }

  Future<VisitaDTO> createVisita(VisitaDTO visita) async {
    final response = await dio.post('/visitas', data: visita.toJson());
    return VisitaDTO.fromJson(response.data);
  }
}
