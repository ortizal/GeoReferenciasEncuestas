class ManzanaDTO {
  final int id;
  final String codigo;
  final String? nombre;
  final String? parroquia;
  final String? barrio;
  final String? sector;
  final int? totalPredios;
  final int? prediosVisitados;
  final int? prediosPositivos;
  final int? prediosNegativos;
  final List<List<List<double>>>? coordenadas;
  final double? latitud;
  final double? longitud;
  final String? grupo;
  final int? grupoId;
  final bool activo;

  ManzanaDTO({
    required this.id,
    required this.codigo,
    this.nombre,
    this.parroquia,
    this.barrio,
    this.sector,
    this.totalPredios,
    this.prediosVisitados,
    this.prediosPositivos,
    this.prediosNegativos,
    this.coordenadas,
    this.latitud,
    this.longitud,
    this.grupo,
    this.grupoId,
    this.activo = true,
  });

  factory ManzanaDTO.fromJson(Map<String, dynamic> json) {
    List<List<List<double>>>? coords;
    if (json['coordenadas'] != null) {
      try {
        final geom = json['coordenadas'];
        if (geom is Map && geom['coordinates'] != null) {
          coords = _parseCoordinates(geom['coordinates']);
        } else if (geom is List) {
          coords = _parseCoordinates(geom);
        }
      } catch (_) {}
    }
    return ManzanaDTO(
      id: json['id'] ?? 0,
      codigo: json['codigo'] ?? '',
      nombre: json['nombre'],
      parroquia: json['parroquia'],
      barrio: json['barrio'],
      sector: json['sector'],
      totalPredios: json['totalPredios'] ?? 0,
      prediosVisitados: json['prediosVisitados'] ?? 0,
      prediosPositivos: json['prediosPositivos'] ?? 0,
      prediosNegativos: json['prediosNegativos'] ?? 0,
      coordenadas: coords,
      latitud: json['latitud']?.toDouble(),
      longitud: json['longitud']?.toDouble(),
      grupo: json['grupo'],
      grupoId: json['grupoId'],
      activo: json['activo'] ?? true,
    );
  }

  static List<List<List<double>>> _parseCoordinates(dynamic coords) {
    if (coords is List && coords.isNotEmpty) {
      if (coords[0] is List && coords[0][0] is List) {
        return (coords[0] as List).map<List<List<double>>>((ring) {
          return (ring as List).map<List<double>>((point) {
            return (point as List).map<double>((v) => (v as num).toDouble()).toList();
          }).toList();
        }).toList();
      }
    }
    return [];
  }
}
