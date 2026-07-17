import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, Grupo } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class GrupoService {
  private apiUrl = `${environment.apiUrl}/grupos`;

  constructor(private http: HttpClient) {}

  buscar(busqueda: string = '', page: number = 0, size: number = 20): Observable<ApiResponse<PaginatedResponse<Grupo>>> {
    let params = new HttpParams()
      .set('busqueda', busqueda)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<PaginatedResponse<Grupo>>>(this.apiUrl, { params });
  }

  obtenerPorId(id: number): Observable<ApiResponse<Grupo>> {
    return this.http.get<ApiResponse<Grupo>>(`${this.apiUrl}/${id}`);
  }

  crear(grupo: Grupo): Observable<ApiResponse<Grupo>> {
    return this.http.post<ApiResponse<Grupo>>(this.apiUrl, grupo);
  }

  actualizar(id: number, grupo: Grupo): Observable<ApiResponse<Grupo>> {
    return this.http.put<ApiResponse<Grupo>>(`${this.apiUrl}/${id}`, grupo);
  }

  eliminar(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  listarTodos(page: number = 0, size: number = 100): Observable<ApiResponse<PaginatedResponse<Grupo>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<PaginatedResponse<Grupo>>>(this.apiUrl, { params });
  }
}
