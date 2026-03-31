import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../api/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth     = inject(AuthService);
  const router   = inject(Router);
  const expected = route.data['role'] as string;
  const actual   = auth.userRole();

  if (actual === expected) return true;

  // Redirect to the correct dashboard based on actual role
  const fallback: Record<string, string> = {
    household: '/household/dashboard',
    collector: '/collector/dashboard',
    admin:     '/admin/dashboard',
  };

  router.navigate([fallback[actual ?? ''] ?? '/auth/login']);
  return false;
};