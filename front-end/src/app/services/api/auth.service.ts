import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User, LoginRequest, SignupRequest, AuthResponse } from '../../models/user.model';

const API_URL   = 'http://localhost:8000/api';
const TOKEN_KEY = 'w2w_token';
const USER_KEY  = 'w2w_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private _currentUser = signal<User | null>(this.loadUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn  = computed(() => !!this._currentUser());
  readonly userRole    = computed(() => this._currentUser()?.role ?? null);

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, payload).pipe(
      tap(res => this.persist(res)),
      catchError(err => throwError(() => err))
    );
  }


  signup(payload: SignupRequest): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${API_URL}/auth/register`, payload)
      .pipe(
        tap(() => this.router.navigate(['/auth/login'], {
          queryParams: { registered: 'true' }   // show "check your email" banner
        })),
        catchError(err => throwError(() => err))
      );
  }

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.http
      .get<{ message: string }>(`${API_URL}/auth/verify`, { params: { token } })
      .pipe(catchError(err => throwError(() => err)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

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
}