import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, mergeMap, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

function processQueue(authService: AuthService, error?: any): void {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(authService.getToken()!);
    }
  });
  failedQueue = [];
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;
          const refreshToken = authService.getRefreshToken();

          if (refreshToken) {
            return authService.refreshToken().pipe(
              switchMap(() => {
                isRefreshing = false;
                processQueue(authService);
                const newToken = authService.getToken()!;
                const clonedReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` }
                });
                return next(clonedReq);
              }),
              catchError((refreshError) => {
                isRefreshing = false;
                processQueue(authService, refreshError);
                authService.logout();
                router.navigate(['/login']);
                return throwError(() => refreshError);
              })
            );
          } else {
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => error);
          }
        } else {
          return from(new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })).pipe(
            mergeMap(token => {
              const clonedReq = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` }
              });
              return next(clonedReq);
            })
          );
        }
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
