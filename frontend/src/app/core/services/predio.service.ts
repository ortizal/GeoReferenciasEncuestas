import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Predio, ApiResponse, PaginatedResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PredioService {
  private apiUrl = `${environment.apiUrl}/predios`;

  constructor(private http: HttpClient) {}

  buscar(busqueda: string = '', activo: boolean = true, page: number = 0, size: number = 10): Observable<ApiResponse<PaginatedResponse<Predio>>> {
    let params = new HttpParams()
      .set('busqueda', busqueda)
      .set('activo', activo.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<PaginatedResponse<Predio>>>(this.apiUrl, { params });
  }

  listarTodas(): Observable<ApiResponse<Predio[]>> {
    return this.http.get<ApiResponse<Predio[]>>(`${this.apiUrl}/listar`);
  }

  listarPorManzana(idManzana: number): Observable<ApiResponse<Predio[]>> {
    return this.http.get<ApiResponse<Predio[]>>(`${this.apiUrl}/manzana/${idManzana}`);
  }

  listarConGeoreferencia(): Observable<ApiResponse<Predio[]>> {
    return this.http.get<ApiResponse<Predio[]>>(`${this.apiUrl}/georeferencia`);
  }

  listarTodosActivos(): Observable<ApiResponse<Predio[]>> {
    return this.http.get<ApiResponse<Predio[]>>(`${this.apiUrl}/todos`);
  }

  listarSinVisitar(idManzana: number): Observable<ApiResponse<Predio[]>> {
    return this.http.get<ApiResponse<Predio[]>>(`${this.apiUrl}/sin-visitar/${idManzana}`);
  }

  obtenerPorId(id: number): Observable<ApiResponse<Predio>> {
    return this.http.get<ApiResponse<Predio>>(`${this.apiUrl}/${id}`);
  }

  crear(predio: Predio): Observable<ApiResponse<Predio>> {
    return this.http.post<ApiResponse<Predio>>(this.apiUrl, predio);
  }

  actualizar(id: number, predio: Predio): Observable<ApiResponse<Predio>> {
    return this.http.put<ApiResponse<Predio>>(`${this.apiUrl}/${id}`, predio);
  }

  eliminar(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  importarExcel(file: File, sessionId: string): Observable<ApiResponse<string>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/importar/excel`, formData, {
      headers: sessionId ? { 'X-Import-Session': sessionId } : {}
    });
  }

  descargarPlantilla(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/plantilla/excel`, { responseType: 'blob' });
  }
}
