export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  usuario: Usuario;
  roles: string[];
}

export interface Usuario {
  idUsuario: number;
  username: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  estado?: string;
  primerLogin?: boolean;
  roles?: string[];
  ultimoAcceso?: string;
  activo?: boolean;
}

export interface Manzana {
  idManzana?: number;
  claveCatastralManzana: string;
  nombre: string;
  sector?: string;
  barrio?: string;
  poligonoGeoJSON?: string;
  area?: number;
  activo?: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  usuarioCreacion?: string;
  totalPredios?: number;
  totalVisitas?: number;
  prediosVisitados?: number;
  prediosPendientes?: number;
}

export interface Predio {
  idPredio?: number;
  idManzana?: number;
  nombreManzana?: string;
  claveCatastral: string;
  propietario: string;
  direccion: string;
  telefono?: string;
  latitud?: number;
  longitud?: number;
  poligonoGeoJSON?: string;
  referencia?: string;
  areaTerreno?: number;
  frentes?: number;
  norte?: number;
  sur?: number;
  este?: number;
  oeste?: number;
  telefonoPropietario?: string;
  areaConstruccion?: number;
  nroPisos?: number;
  uso?: string;
  nroPredial?: string;
  cedulaCatastral?: string;
  serviciosBasicos?: string;
  codPredio?: string;
  estado?: string;
  observaciones?: string;
  activo?: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  usuarioCreacion?: string;
  estadoVisita?: string;
  fechaUltimaVisita?: string;
  totalVisitas?: number;
}

export interface Visita {
  idVisita?: number;
  idPredio?: number;
  claveCatastralPredio?: string;
  propietarioPredio?: string;
  idUsuarioVisitador?: number;
  nombreVisitador?: string;
  fechaVisita?: string;
  estadoVisita?: string;
  observaciones?: string;
  fotografia?: string;
  latitudVisita?: number;
  longitudVisita?: number;
  horaInicio?: string;
  horaFin?: string;
  viviendaTrabajable?: boolean;
  fechaCreacion?: string;
}

export interface Dashboard {
  totalManzanas: number;
  totalPredios: number;
  totalVisitas: number;
  positivos: number;
  negativos: number;
  indecisos: number;
  sinVisitar: number;
  pendientes: number;
  reprogramadas: number;
  noLocalizadas: number;
  rechazadas: number;
  finalizadas: number;
  porcentajeCobertura: number;
  visitasPorEstado: any[];
  visitasPorMes: any[];
  visitasPorUsuario: any[];
  visitasRecientes: any[];
}

export interface ApiResponse<T> {
  exitoso: boolean;
  mensaje: string;
  datos: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export type EstadoVisita = 
  | 'SIN_VISITAR' 
  | 'PENDIENTE' 
  | 'POSITIVO' 
  | 'NEGATIVO' 
  | 'INDECISO'
  | 'REPROGRAMADA' 
  | 'NO_LOCALIZADA' 
  | 'RECHAZADA' 
  | 'FINALIZADA';
