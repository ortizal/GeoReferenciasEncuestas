import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getCurrentUser();
    if (user && user.roles) {
      const hasRole = user.roles.some(role => allowedRoles.includes(role));
      if (hasRole) {
        return true;
      }
    }

    router.navigate(['/dashboard']);
    return false;
  };
};
