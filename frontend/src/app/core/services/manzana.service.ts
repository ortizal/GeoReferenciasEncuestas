import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Manzana, ApiResponse, PaginatedResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ManzanaService {
  private apiUrl = `${environment.apiUrl}/manzanas`;

  constructor(private http: HttpClient) {}

  buscar(busqueda: string = '', activo: boolean = true, page: number = 0, size: number = 10, sortField: string = 'nombre', sortDir: string = 'asc'): Observable<ApiResponse<PaginatedResponse<Manzana>>> {
    let params = new HttpParams()
      .set('busqueda', busqueda)
      .set('activo', activo.toString())
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortField', sortField)
      .set('sortDir', sortDir);
    return this.http.get<ApiResponse<PaginatedResponse<Manzana>>>(this.apiUrl, { params });
  }

  listarTodas(): Observable<ApiResponse<Manzana[]>> {
    return this.http.get<ApiResponse<Manzana[]>>(`${this.apiUrl}/listar`);
  }

  listarConPoligono(): Observable<ApiResponse<Manzana[]>> {
    return this.http.get<ApiResponse<Manzana[]>>(`${this.apiUrl}/poligonos`);
  }

  obtenerPorId(id: number): Observable<ApiResponse<Manzana>> {
    return this.http.get<ApiResponse<Manzana>>(`${this.apiUrl}/${id}`);
  }

  crear(manzana: Manzana): Observable<ApiResponse<Manzana>> {
    return this.http.post<ApiResponse<Manzana>>(this.apiUrl, manzana);
  }

  actualizar(id: number, manzana: Manzana): Observable<ApiResponse<Manzana>> {
    return this.http.put<ApiResponse<Manzana>>(`${this.apiUrl}/${id}`, manzana);
  }

  eliminar(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  importarExcel(file: File, sessionId: string): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/importar/excel`, formData, {
      headers: sessionId ? { 'X-Import-Session': sessionId } : {}
    });
  }

  previewExcel(file: File): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/importar/preview`, formData);
  }

  descargarPlantilla(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/plantilla/excel`, { responseType: 'blob' });
  }
}
