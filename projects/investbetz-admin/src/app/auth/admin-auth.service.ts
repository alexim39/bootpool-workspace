import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, catchError, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

const AUTH_KEY = 'ib_token';
const ADMIN_CHECK_KEY = 'ib_admin';

export interface AdminAuthState {
  authenticated: boolean;
  checked: boolean;
  user: { email: string; fullName: string; role: string } | null;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  private state = signal<AdminAuthState>({
    authenticated: false,
    checked: false,
    user: null
  });

  readonly authenticated = computed(() => this.state().authenticated);
  readonly checked = computed(() => this.state().checked);
  readonly user = computed(() => this.state().user);

  constructor() {
    if (localStorage.getItem(AUTH_KEY)) {
      this.verifyAndSet().subscribe();
    } else {
      this.state.update(s => ({ ...s, checked: true }));
    }
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(AUTH_KEY, token);
    this.state.update(s => ({ ...s }));
  }

  verifyApi(): Observable<boolean> {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      this.state.set({ authenticated: false, checked: true, user: null });
      return of(false);
    }
    return this.verifyAndSet();
  }

  loginWithToken(token: string): Observable<boolean> {
    localStorage.setItem(AUTH_KEY, token);
    return this.verifyAndSet().pipe(
      map(ok => {
        if (ok) this.router.navigate(['/admin/dashboard']);
        return ok;
      })
    );
  }

  refreshSession(): Observable<boolean> {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      this.clearAuth();
      return of(false);
    }
    return this.verifyAndSet();
  }

  refreshToken(): Observable<{ success: boolean; token: string }> {
    const t = localStorage.getItem(AUTH_KEY);
    if (!t) return throwError(() => new Error('No token'));
    return this.http.post<{ success: boolean; token: string }>(
      `${this.apiUrl}/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${t}` } }
    );
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/admin/login']);
  }

  private verifyAndSet(): Observable<boolean> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem(AUTH_KEY) || ''}` });
    return this.http.get<{ success: boolean; data: { role: string; email: string; fullName: string } }>(
      `${this.apiUrl}/auth/verify`, { headers }
    ).pipe(
      map(res => {
        if (res.success && res.data?.role === 'admin') {
          localStorage.setItem(ADMIN_CHECK_KEY, 'true');
          this.state.set({ authenticated: true, checked: true, user: res.data });
          return true;
        }
        if (res.data && res.data.role !== 'admin') {
          this.clearAuth();
          return false;
        }
        this.clearAuth();
        return false;
      }),
      catchError(() => {
        this.state.set({ authenticated: false, checked: true, user: null });
        return of(false);
      })
    );
  }

  private clearAuth(): void {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ADMIN_CHECK_KEY);
    this.state.set({ authenticated: false, checked: true, user: null });
  }
}
