import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../api/auth.service';
import { UserRole } from '../../models/user.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth     = inject(AuthService);
  const router   = inject(Router);
  const required = route.data['role'] as UserRole;

  if (auth.userRole() === required) return true;

  const fallback = auth.userRole() === 'household'
    ? '/household/dashboard'
    : '/collector/dashboard';
  router.navigate([fallback]);
  return false;
};