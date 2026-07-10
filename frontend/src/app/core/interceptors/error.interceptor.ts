import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        console.error('Acceso denegado');
      } else if (error.status === 404) {
        console.error('Recurso no encontrado');
      } else if (error.status >= 500) {
        console.error('Error del servidor');
      }

      return throwError(() => error);
    })
  );
};
