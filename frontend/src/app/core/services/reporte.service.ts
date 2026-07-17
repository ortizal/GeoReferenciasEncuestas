import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  visitasPorUsuario(fechaInicio: string, fechaFin: string): Observable<ApiResponse<any[]>> {
    const params = new HttpParams().set('fechaInicio', fechaInicio).set('fechaFin', fechaFin);
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/visitantes/reportes/por-usuario`, { params });
  }

  visitasPorSector(fechaInicio: string, fechaFin: string): Observable<ApiResponse<any[]>> {
    const params = new HttpParams().set('fechaInicio', fechaInicio).set('fechaFin', fechaFin);
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/visitantes/reportes/por-sector`, { params });
  }

  prediosPendientes(busqueda: string): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('busqueda', busqueda).set('page', '0').set('size', '500');
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/predios`, { params });
  }

  mapaTematico(estado: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/dashboard/predios-por-estado/${estado}`);
  }

  cobertura(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/dashboard`);
  }

  productividad(fechaInicio: string, fechaFin: string): Observable<ApiResponse<any[]>> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('desde', fechaInicio);
    if (fechaFin) params = params.set('hasta', fechaFin);
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/dashboard/grupo-stats`, { params });
  }

  descargarExcel(url: string, params?: any): void {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => { if (params[k]) httpParams = httpParams.set(k, params[k]); });
    }
    const link = document.createElement('a');
    link.href = `${this.apiUrl}/${url}?${httpParams.toString()}`;
    link.download = '';
    link.click();
  }

  descargarPDF(url: string, params?: any): void {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => { if (params[k]) httpParams = httpParams.set(k, params[k]); });
    }
    this.http.get(`${this.apiUrl}/${url}`, { params: httpParams, responseType: 'blob' }).subscribe({
      next: (blob) => {
        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = urlBlob;
        link.download = 'reporte.pdf';
        link.click();
        window.URL.revokeObjectURL(urlBlob);
      },
      error: () => alert('Error al descargar PDF')
    });
  }
}
