import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, Usuario, ApiResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  
  private currentUserSignal = signal<Usuario | null>(this.loadUser());
  
  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => !!this.currentUserSignal());
  isAdmin = computed(() => {
    const user = this.currentUserSignal();
    return user?.roles?.includes('ADMINISTRADOR') ?? false;
  });
  isSupervisor = computed(() => {
    const user = this.currentUserSignal();
    return user?.roles?.includes('SUPERVISOR') ?? false;
  });
  isVisitador = computed(() => {
    const user = this.currentUserSignal();
    return user?.roles?.includes('VISITADOR') ?? false;
  });

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        if (response.exitoso && response.datos) {
          localStorage.setItem(environment.tokenKey, response.datos.accessToken);
          localStorage.setItem(environment.refreshTokenKey, response.datos.refreshToken);
          localStorage.setItem(environment.userKey, JSON.stringify(response.datos.usuario));
          this.currentUserSignal.set(response.datos.usuario);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
    localStorage.removeItem(environment.userKey);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(environment.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(environment.refreshTokenKey);
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSignal();
  }

  refreshToken(): Observable<ApiResponse<LoginResponse>> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(response => {
        if (response.exitoso && response.datos) {
          localStorage.setItem(environment.tokenKey, response.datos.accessToken);
          localStorage.setItem(environment.refreshTokenKey, response.datos.refreshToken);
        }
      })
    );
  }

  cambioContrasena(actual: string, nueva: string, confirmar: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/cambio-contrasena`, {
      contrasenaActual: actual,
      nuevaContrasena: nueva,
      confirmarContrasena: confirmar
    });
  }

  recuperarContrasena(email: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/recuperar-contrasena`, null, {
      params: { email }
    });
  }

  private loadUser(): Usuario | null {
    const userJson = localStorage.getItem(environment.userKey);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }
}
