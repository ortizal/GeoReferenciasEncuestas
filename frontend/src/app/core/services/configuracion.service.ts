import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/models';

export interface Permiso {
  idPermiso: number;
  nombre: string;
  descripcion: string;
  idModulo: number;
  nombreModulo: string;
  activo: boolean;
}

export interface Modulo {
  idModulo: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  permisos?: Permiso[];
}

export interface RolPermisos {
  idRol: number;
  nombre: string;
  descripcion: string;
  permisos: Permiso[];
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private apiUrl = `${environment.apiUrl}/configuracion`;

  constructor(private http: HttpClient) {}

  listarModulos(): Observable<ApiResponse<Modulo[]>> {
    return this.http.get<ApiResponse<Modulo[]>>(`${this.apiUrl}/modulos`);
  }

  listarPermisos(): Observable<ApiResponse<Permiso[]>> {
    return this.http.get<ApiResponse<Permiso[]>>(`${this.apiUrl}/permisos`);
  }

  listarRoles(): Observable<ApiResponse<RolPermisos[]>> {
    return this.http.get<ApiResponse<RolPermisos[]>>(`${this.apiUrl}/roles`);
  }

  actualizarPermisosRol(idRol: number, idsPermisos: number[]): Observable<ApiResponse<RolPermisos>> {
    return this.http.put<ApiResponse<RolPermisos>>(`${this.apiUrl}/roles/${idRol}/permisos`, idsPermisos);
  }
}
