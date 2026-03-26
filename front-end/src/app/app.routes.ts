import { Routes } from '@angular/router';
import { authGuard } from './services/auth/auth.guard';
import { roleGuard } from './services/auth/role.guard';

export const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // Auth routes (lazy loaded)
  {
    path: 'auth',
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/auth/login/login').then(m => m.LoginComponent)
      },
      {
        path: 'signup',
        loadComponent: () =>
          import('./pages/auth/signup/signup').then(m => m.SignupComponent)
      }
    ]
  },

  // Household routes
  {
    path: 'household',
    canActivate: [authGuard, roleGuard],
    data: { role: 'household' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/household/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'schedule-pickup',
        loadComponent: () =>
          import('./pages/household/schedule-pickup/schedule-pickup').then(m => m.SchedulePickupComponent)
      },
      {
        path: 'pickup-history',
        loadComponent: () =>
          import('./pages/household/pickup-history/pickup-history').then(m => m.PickupHistoryComponent)
      } 
    ]
  },

  // Collector routes
  {
    path: 'collector',
    canActivate: [authGuard, roleGuard],
    data: { role: 'collector' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/collector/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'pickup-requests',
        loadComponent: () =>
          import('./pages/collector/pickup-requests/pickup-requests').then(m => m.PickupRequests)
      }
    ]
  },

  // Fallback
  { path: '**', redirectTo: 'auth/login' }
];