class PredioDTO {
  final int id;
  final String claveCatastral;
  final String? propietario;
  final String? direccion;
  final String? telefono;
  final String? estadoVisita;
  final DateTime? fechaCreacion;
  final DateTime? fechaUltimaVisita;
  final int? manzanaId;
  final String? manzanaCodigo;
  final String? grupo;
  final int? grupoId;
  final double? latitud;
  final double? longitud;
  final String? observaciones;
  final String? numeroPredial;
  final int? AP;
  final int? estrella;
  final List<List<List<double>>>? coordenadas;

  PredioDTO({
    required this.id,
    required this.claveCatastral,
    this.propietario,
    this.direccion,
    this.telefono,
    this.estadoVisita,
    this.fechaCreacion,
    this.fechaUltimaVisita,
    this.manzanaId,
    this.manzanaCodigo,
    this.grupo,
    this.grupoId,
    this.latitud,
    this.longitud,
    this.observaciones,
    this.numeroPredial,
    this.AP,
    this.estrella,
    this.coordenadas,
  });

  factory PredioDTO.fromJson(Map<String, dynamic> json) {
    List<List<List<double>>>? coords;
    if (json['coordenadas'] != null) {
      try {
        final geom = json['coordenadas'];
        if (geom is Map && geom['coordinates'] != null) {
          coords = _parseCoordinates(geom['coordinates']);
        }
      } catch (_) {}
    }

    return PredioDTO(
      id: json['id'] ?? 0,
      claveCatastral: json['claveCatastral'] ?? json['clave_catastral'] ?? '',
      propietario: json['propietario'],
      direccion: json['direccion'],
      telefono: json['telefono'],
      estadoVisita: json['estadoVisita'],
      fechaCreacion: json['fechaCreacion'] != null ? DateTime.tryParse(json['fechaCreacion']) : null,
      fechaUltimaVisita: json['fechaUltimaVisita'] != null ? DateTime.tryParse(json['fechaUltimaVisita']) : null,
      manzanaId: json['manzanaId'],
      manzanaCodigo: json['manzanaCodigo'],
      grupo: json['grupo'],
      grupoId: json['grupoId'],
      latitud: json['latitud']?.toDouble(),
      longitud: json['longitud']?.toDouble(),
      observaciones: json['observaciones'],
      numeroPredial: json['numeroPredial'],
      AP: json['AP'],
      estrella: json['estrella'],
      coordenadas: coords,
    );
  }

  static List<List<List<double>>> _parseCoordinates(dynamic coords) {
    if (coords is List && coords.isNotEmpty && coords[0] is List && coords[0][0] is List) {
      return (coords[0] as List).map<List<List<double>>>((ring) {
        return (ring as List).map<List<double>>((point) {
          return (point as List).map<double>((v) => (v as num).toDouble()).toList();
        }).toList();
      }).toList();
    }
    return [];
  }
}
