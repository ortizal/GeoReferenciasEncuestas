import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../dashboard/data/predio_model.dart';
import '../../dashboard/data/assignment_service.dart';
import '../../dashboard/providers/dashboard_provider.dart';
import '../../../core/network/dio_client.dart';
import '../../visitas/data/visita_model.dart';
import '../../sync/data/sync_service.dart';

class VisitaFormScreen extends ConsumerStatefulWidget {
  final PredioDTO predio;
  const VisitaFormScreen({super.key, required this.predio});

  @override
  ConsumerState<VisitaFormScreen> createState() => _VisitaFormScreenState();
}

class _VisitaFormScreenState extends ConsumerState<VisitaFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _obsCtrl = TextEditingController();
  String _selectedEstado = '';

  static const _estados = [
    {'value': 'POSITIVO', 'label': 'Positivo', 'color': AppTheme.positivo, 'icon': Icons.check_circle},
    {'value': 'NEGATIVO', 'label': 'Negativo', 'color': AppTheme.negativo, 'icon': Icons.cancel},
    {'value': 'INDECISO', 'label': 'Indeciso', 'color': AppTheme.indeciso, 'icon': Icons.help_outline},
    {'value': 'NO_TRABAJABLE', 'label': 'No Trabajable', 'color': AppTheme.noTrabajable, 'icon': Icons.block},
  ];

  @override
  void dispose() {
    _obsCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_selectedEstado.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Seleccione un estado'), backgroundColor: AppTheme.negativo),
      );
      return;
    }

    try {
      final service = AssignmentService(dio: ref.read(dioProvider));
      final visita = VisitaDTO(
        predioId: widget.predio.id,
        estado: _selectedEstado,
        observaciones: _obsCtrl.text.isNotEmpty ? _obsCtrl.text : null,
      );
      await service.createVisita(visita);
      ref.read(dashboardProvider.notifier).loadData();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Visita registrada'), backgroundColor: AppTheme.positivo),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        final sync = ref.read(syncProvider.notifier);
        final visita = VisitaDTO(
          predioId: widget.predio.id,
          estado: _selectedEstado,
          observaciones: _obsCtrl.text.isNotEmpty ? _obsCtrl.text : null,
          fechaVisita: DateTime.now(),
        );
        await sync.savePendingVisita(visita);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sin conexion. Visita guardada localmente'), backgroundColor: AppTheme.indeciso),
        );
        Navigator.pop(context);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Registrar Visita')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildPredioInfo(),
              const SizedBox(height: 24),
              const Text('Estado de la Visita', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              _buildEstadoGrid(),
              const SizedBox(height: 24),
              TextFormField(
                controller: _obsCtrl,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'Observaciones (opcional)',
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _submit,
                  child: const Text('Guardar Visita', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPredioInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.predio.claveCatastral, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            _infoRow('Propietario', widget.predio.propietario ?? 'N/A'),
            _infoRow('Direccion', widget.predio.direccion ?? 'N/A'),
            _infoRow('Manzana', widget.predio.manzanaCodigo ?? 'N/A'),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text('$label: ', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13))),
        ],
      ),
    );
  }

  Widget _buildEstadoGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 1.5, crossAxisSpacing: 12, mainAxisSpacing: 12),
      itemCount: _estados.length,
      itemBuilder: (ctx, i) {
        final e = _estados[i];
        final selected = _selectedEstado == e['value'];
        return GestureDetector(
          onTap: () => setState(() => _selectedEstado = e['value'] as String),
          child: Container(
            decoration: BoxDecoration(
              color: selected ? (e['color'] as Color).withOpacity(0.15) : AppTheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: selected ? e['color'] as Color : AppTheme.border, width: selected ? 2 : 1),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(e['icon'] as IconData, color: e['color'] as Color, size: 32),
                const SizedBox(height: 8),
                Text(e['label'] as String, style: TextStyle(fontWeight: FontWeight.w600, color: selected ? e['color'] as Color : AppTheme.textPrimary)),
              ],
            ),
          ),
        );
      },
    );
  }
}
