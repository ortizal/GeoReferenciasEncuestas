import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Dashboard, ApiResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  obtenerDashboard(): Observable<ApiResponse<Dashboard>> {
    return this.http.get<ApiResponse<Dashboard>>(this.apiUrl);
  }

  obtenerVisitasPorDia(desde?: string, hasta?: string): Observable<ApiResponse<any[]>> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/visitas-por-dia`, { params });
  }

  obtenerDashboardPorUsuario(idUsuario: number): Observable<ApiResponse<Dashboard>> {
    return this.http.get<ApiResponse<Dashboard>>(`${this.apiUrl}/usuario/${idUsuario}`);
  }

  obtenerDashboardPorManzana(idManzana: number): Observable<ApiResponse<Dashboard>> {
    return this.http.get<ApiResponse<Dashboard>>(`${this.apiUrl}/manzana/${idManzana}`);
  }

  topManzanasPositivos(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/top-manzanas-positivos`);
  }

  topManzanasArEstrellas(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/top-manzanas-ar-estrellas`);
  }
}
