import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  obtenerDashboardPorUsuario(idUsuario: number): Observable<ApiResponse<Dashboard>> {
    return this.http.get<ApiResponse<Dashboard>>(`${this.apiUrl}/usuario/${idUsuario}`);
  }

  obtenerDashboardPorManzana(idManzana: number): Observable<ApiResponse<Dashboard>> {
    return this.http.get<ApiResponse<Dashboard>>(`${this.apiUrl}/manzana/${idManzana}`);
  }
}
