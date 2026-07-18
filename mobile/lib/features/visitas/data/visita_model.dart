class VisitaDTO {
  final int? id;
  final int? predioId;
  final String? predioClave;
  final String? propietario;
  final String? estado;
  final String? observaciones;
  final DateTime? fechaVisita;
  final int? visitadorId;
  final String? visitadorNombre;
  final int? manzanaId;
  final String? manzanaCodigo;
  final String? brigada;
  final String? grupo;
  final String? parroquia;
  final String? barrio;

  VisitaDTO({
    this.id,
    this.predioId,
    this.predioClave,
    this.propietario,
    this.estado,
    this.observaciones,
    this.fechaVisita,
    this.visitadorId,
    this.visitadorNombre,
    this.manzanaId,
    this.manzanaCodigo,
    this.brigada,
    this.grupo,
    this.parroquia,
    this.barrio,
  });

  factory VisitaDTO.fromJson(Map<String, dynamic> json) {
    return VisitaDTO(
      id: json['id'],
      predioId: json['predioId'],
      predioClave: json['predioClave'] ?? json['claveCatastral'],
      propietario: json['propietario'],
      estado: json['estado'] ?? json['estadoVisita'],
      observaciones: json['observaciones'],
      fechaVisita: json['fechaVisita'] != null ? DateTime.tryParse(json['fechaVisita']) : null,
      visitadorId: json['visitadorId'],
      visitadorNombre: json['visitadorNombre'],
      manzanaId: json['manzanaId'],
      manzanaCodigo: json['manzanaCodigo'],
      brigada: json['brigada'],
      grupo: json['grupo'],
      parroquia: json['parroquia'],
      barrio: json['barrio'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'predioId': predioId,
      'estado': estado,
      'observaciones': observaciones,
      'fechaVisita': fechaVisita?.toIso8601String(),
    };
  }
}

class VisitCreateRequest {
  final int predioId;
  final String estado;
  final String? observaciones;

  VisitCreateRequest({
    required this.predioId,
    required this.estado,
    this.observaciones,
  });

  Map<String, dynamic> toJson() => {
        'predioId': predioId,
        'estado': estado,
        if (observaciones != null) 'observaciones': observaciones,
      };
}
