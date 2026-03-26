import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { tap, delay } from 'rxjs/operators';
import { User, LoginRequest, SignupRequest, AuthResponse } from '../../models/user.model';

const API_URL   = 'http://localhost:8000/api';
const TOKEN_KEY = 'w2w_token';
const USER_KEY  = 'w2w_user';
const USE_MOCK  = true; // ← flip to false when backend is ready

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private _currentUser = signal<User | null>(this.loadUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn  = computed(() => !!this._currentUser());
  readonly userRole    = computed(() => this._currentUser()?.role ?? null);

  // ── Login ──────────────────────────────────────────────
  login(payload: LoginRequest): Observable<AuthResponse> {
    if (USE_MOCK) return this.mockLogin(payload);
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, payload).pipe(
      tap(res => this.persist(res))
    );
  }

  // ── Signup ─────────────────────────────────────────────
  signup(payload: SignupRequest): Observable<AuthResponse> {
    if (USE_MOCK) return this.mockSignup(payload);
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, payload).pipe(
      tap(res => this.persist(res))
    );
  }

  // ── Logout ─────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // ── Persist ────────────────────────────────────────────
  private persist(res: AuthResponse): void {
    const user: User = { ...res.user, token: res.token };
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._currentUser.set(user);
    const route = user.role === 'household' ? '/household/dashboard' : '/collector/dashboard';
    this.router.navigate([route]);
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  // ── Mock implementations ───────────────────────────────
  private mockLogin(payload: LoginRequest): Observable<AuthResponse> {
    const stored = localStorage.getItem('w2w_mock_users');
    const users: User[] = stored ? JSON.parse(stored) : [];
    const user = users.find(u => u.email === payload.email);

    if (!user) {
      return throwError(() => ({ error: { message: 'No account found with that email.' } }));
    }

    const res: AuthResponse = { user, token: 'mock-jwt-token-' + Date.now() };
    return of(res).pipe(delay(600), tap(r => this.persist(r)));
  }

  private mockSignup(payload: SignupRequest): Observable<AuthResponse> {
    const stored = localStorage.getItem('w2w_mock_users');
    const users: User[] = stored ? JSON.parse(stored) : [];

    if (users.find(u => u.email === payload.email)) {
      return throwError(() => ({ error: { message: 'An account with this email already exists.' } }));
    }

    const newUser: User = {
      id: 'user_' + Date.now(),
      firstName: payload.firstName,
      lastName:  payload.lastName,
      email:     payload.email,
      phone:     payload.phone,
      role:      payload.role,
      points:    0
    };

    users.push(newUser);
    localStorage.setItem('w2w_mock_users', JSON.stringify(users));

    const res: AuthResponse = { user: newUser, token: 'mock-jwt-token-' + Date.now() };
    return of(res).pipe(delay(800), tap(r => this.persist(r)));
  }
}