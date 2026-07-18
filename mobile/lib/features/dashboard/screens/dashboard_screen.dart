import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/dashboard_provider.dart';
import '../../visitas/screens/visita_form_screen.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(dashboardProvider.notifier).loadData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(dashboardProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mi Assignment'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(dashboardProvider.notifier).loadData(),
          ),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                _buildStatsBar(state),
                Expanded(child: _buildMap(state)),
              ],
            ),
    );
  }

  Widget _buildStatsBar(DashboardState state) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      color: AppTheme.surface,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _statChip('Total', state.totalPredios.toString(), AppTheme.primary),
          _statChip('Visitados', state.prediosVisitados.toString(), AppTheme.positivo),
          _statChip('Positivos', state.prediosPositivos.toString(), AppTheme.positivo),
          _statChip('Negativos', state.prediosNegativos.toString(), AppTheme.negativo),
          _statChip('Indecisos', state.prediosIndecisos.toString(), AppTheme.indeciso),
        ],
      ),
    );
  }

  Widget _statChip(String label, String value, Color color) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
      ],
    );
  }

  Widget _buildMap(DashboardState state) {
    final allPoints = <LatLng>[];
    for (final predio in state.predios) {
      if (predio.latitud != null && predio.longitud != null) {
        allPoints.add(LatLng(predio.latitud!, predio.longitud!));
      }
    }

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: allPoints.isNotEmpty ? allPoints.first : const LatLng(-1.8312, -79.5226),
        initialZoom: 14,
        onTap: (tapPos, latLng) {},
      ),
      children: [
        TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'com.alantek.georeferencias'),
        _buildManzanaPolygons(state),
        _buildPredioMarkers(state),
      ],
    );
  }

  Widget _buildManzanaPolygons(DashboardState state) {
    final polygons = <Polygon>[];
    for (final manzana in state.manzanas) {
      if (manzana.coordenadas != null && manzana.coordenadas!.isNotEmpty) {
        final points = manzana.coordenadas![0].map((p) => LatLng(p[1], p[0])).toList();
        if (points.length >= 3) {
          polygons.add(Polygon(
            points: points,
            color: Colors.blue.withOpacity(0.1),
            borderColor: AppTheme.primary,
            borderStrokeWidth: 2,
          ));
        }
      }
    }
    return PolygonLayer(polygons: polygons);
  }

  Widget _buildPredioMarkers(DashboardState state) {
    return MarkerLayer(markers: state.predios.where((p) => p.latitud != null && p.longitud != null).map((p) {
      final color = _getColorForEstado(p.estadoVisita);
      return Marker(
        point: LatLng(p.latitud!, p.longitud!),
        width: 24,
        height: 24,
        child: GestureDetector(
          onTap: () => _showPredioDetail(p),
          child: Container(
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
              boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 4)],
            ),
          ),
        ),
      );
    }).toList());
  }

  Color _getColorForEstado(String? estado) {
    switch (estado) {
      case 'POSITIVO': return AppTheme.positivo;
      case 'NEGATIVO': return AppTheme.negativo;
      case 'INDECISO': return AppTheme.indeciso;
      case 'NO_TRABAJABLE': return AppTheme.noTrabajable;
      default: return AppTheme.enBlanco;
    }
  }

  void _showPredioDetail(dynamic predio) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.5,
        maxChildSize: 0.8,
        expand: false,
        builder: (ctx, scrollCtrl) => SingleChildScrollView(
          controller: scrollCtrl,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2))),
              ),
              const SizedBox(height: 16),
              Text(predio.claveCatastral, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              _detailRow(Icons.person, 'Propietario', predio.propietario ?? 'N/A'),
              _detailRow(Icons.home, 'Direccion', predio.direccion ?? 'N/A'),
              _detailRow(Icons.info, 'Estado', predio.estadoVisita ?? 'EN_BLANCO'),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.edit_document),
                  label: const Text('Registrar Visita'),
                  onPressed: () {
                    Navigator.pop(ctx);
                    Navigator.push(context, MaterialPageRoute(builder: (_) => VisitaFormScreen(predio: predio)));
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(children: [
        Icon(icon, size: 18, color: AppTheme.textSecondary),
        const SizedBox(width: 8),
        Text('$label: ', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
        Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13))),
      ]),
    );
  }
}
