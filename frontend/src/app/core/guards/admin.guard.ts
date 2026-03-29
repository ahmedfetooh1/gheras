import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const user = authService.currentUser();

  if (user && (user as any).role === 'admin') {
    return true;
  }

  console.warn('🚫 Admin Guard: Access denied.');

  if (!user) {
    router.navigate(['/login']);
  } else {
    router.navigate(['/dashboard']);
  }

  return false;
};
