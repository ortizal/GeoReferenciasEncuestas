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

  buscar(busqueda: string = '', activo: boolean = true, page: number = 0, size: number = 10): Observable<ApiResponse<PaginatedResponse<Manzana>>> {
    let params = new HttpParams()
      .set('busqueda', busqueda)
      .set('activo', activo.toString())
      .set('page', page.toString())
      .set('size', size.toString());
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
}
