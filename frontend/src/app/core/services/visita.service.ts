import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Visita, ApiResponse, PaginatedResponse, EstadoVisita } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class VisitaService {
  private apiUrl = `${environment.apiUrl}/visitas`;

  constructor(private http: HttpClient) {}

  buscar(busqueda: string = '', page: number = 0, size: number = 20, estado: string = '', desde: string = '', hasta: string = '', sortField: string = 'fechaVisita', sortDir: string = 'desc'): Observable<ApiResponse<PaginatedResponse<Visita>>> {
    let params = new HttpParams()
      .set('busqueda', busqueda)
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortField', sortField)
      .set('sortDir', sortDir);
    if (estado) params = params.set('estado', estado);
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ApiResponse<PaginatedResponse<Visita>>>(this.apiUrl, { params });
  }

  listarPorPredio(idPredio: number): Observable<ApiResponse<Visita[]>> {
    return this.http.get<ApiResponse<Visita[]>>(`${this.apiUrl}/predio/${idPredio}`);
  }

  listarPorUsuario(idUsuario: number): Observable<ApiResponse<Visita[]>> {
    return this.http.get<ApiResponse<Visita[]>>(`${this.apiUrl}/usuario/${idUsuario}`);
  }

  listarPorManzana(idManzana: number): Observable<ApiResponse<Visita[]>> {
    return this.http.get<ApiResponse<Visita[]>>(`${this.apiUrl}/manzana/${idManzana}`);
  }

  listarPorEstado(estado: EstadoVisita): Observable<ApiResponse<Visita[]>> {
    return this.http.get<ApiResponse<Visita[]>>(`${this.apiUrl}/estado/${estado}`);
  }

  obtenerPorId(id: number): Observable<ApiResponse<Visita>> {
    return this.http.get<ApiResponse<Visita>>(`${this.apiUrl}/${id}`);
  }

  obtenerUltimaVisita(idPredio: number): Observable<ApiResponse<Visita>> {
    return this.http.get<ApiResponse<Visita>>(`${this.apiUrl}/ultima/${idPredio}`);
  }

  crear(visita: Visita): Observable<ApiResponse<Visita>> {
    return this.http.post<ApiResponse<Visita>>(this.apiUrl, visita);
  }

  actualizar(id: number, visita: Visita): Observable<ApiResponse<Visita>> {
    return this.http.put<ApiResponse<Visita>>(`${this.apiUrl}/${id}`, visita);
  }

  eliminar(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  contarPorEstado(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/estadisticas`);
  }

  previsualizarImportacion(file: File): Observable<ApiResponse<Visita[]>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<Visita[]>>(`${this.apiUrl}/importar/visitas`, formData);
  }

  confirmarImportacion(visitas: Visita[], sessionId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/importar/confirmar`, visitas, {
      headers: sessionId ? { 'X-Import-Session': sessionId } : {}
    });
  }

  descargarReporteNoEncontrados(visitas: Visita[]): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/importar/reporte-no-encontrados`, visitas, { responseType: 'blob' });
  }

  exportarExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exportar/excel`, { responseType: 'blob' });
  }

  exportarPDF(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exportar/pdf`, { responseType: 'blob' });
  }
}
