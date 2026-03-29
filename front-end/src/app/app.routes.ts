import { Routes } from '@angular/router';
import { authGuard } from './services/auth/auth.guard';
import { roleGuard } from './services/auth/role.guard';
import { Layout } from './components/layout/layout';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // ── Auth (no layout) ──────────────────────────────────
  {
    path: 'auth',
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () => import('./pages/auth/login/login').then(m => m.LoginComponent)
      },
      {
        path: 'signup',
        loadComponent: () => import('./pages/auth/signup/signup').then(m => m.SignupComponent)
      },
      // {
      //   path: 'verify-email',
      //   loadComponent: () => import('./pages/auth/verify-email/verify-email').then(m => m.VerifyEmailComponent)
      // }
    ]
  },

  // ── Protected routes (inside Layout shell) ────────────
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [

      // Household
      {
        path: 'household',
        canActivate: [roleGuard],
        data: { role: 'household' },
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          {
            path: 'dashboard',
            loadComponent: () => import('./pages/household/dashboard/dashboard').then(m => m.Dashboard)
          },
          {
            path: 'schedule-pickup',
            loadComponent: () => import('./pages/household/schedule-pickup/schedule-pickup').then(m => m.SchedulePickupComponent)
          },
          {
            path: 'pickup-history',
            loadComponent: () => import('./pages/household/pickup-history/pickup-history').then(m => m.PickupHistoryComponent)
          },
          {
            path: 'profile',
            loadComponent: () => import('./pages/household/profile/profile').then(m => m.Profile)
          }
        ]
      },

      // Collector
      {
        path: 'collector',
        canActivate: [roleGuard],
        data: { role: 'collector' },
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          {
            path: 'dashboard',
            loadComponent: () => import('./pages/collector/dashboard/dashboard').then(m => m.Dashboard)
          },
          {
            path: 'pickup-requests',
            loadComponent: () => import('./pages/collector/pickup-requests/pickup-requests').then(m => m.PickupRequests)
          },
          {
            path: 'earnings',
            loadComponent: () => import('./pages/collector/earnings/earnings').then(m => m.EarningsComponent)
          },
          {
            path: 'profile',
            loadComponent: () => import('./pages/household/profile/profile').then(m => m.Profile)
          }
        ]
      }
    ]
  },

  { path: '**', redirectTo: 'auth/login' }
];