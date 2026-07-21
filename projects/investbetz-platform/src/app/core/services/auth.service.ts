import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  phone: string;
  fullName: string;
  email?: string;
  phoneVerified: boolean;
  kycVerified: boolean;
  referralCode: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
  };
  token?: string;
  user?: User;
}

export interface OtpResponse {
  success: boolean;
  message?: string;
  phone?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'ib_token';
  private readonly USER_KEY = 'ib_user';

  user = signal<User | null>(null);
  token = signal<string | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  isAuthenticated = computed(() => !!this.token() && !!this.user());
  isPhoneVerified = computed(() => this.user()?.phoneVerified ?? false);
  isKycVerified = computed(() => this.user()?.kycVerified ?? false);

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredAuth();
  }

  private loadStoredAuth() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);
    if (token && userStr) {
      try {
        this.token.set(token);
        this.user.set(JSON.parse(userStr));
      } catch {
        this.clearAuth();
      }
    }
  }

  private clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.user.set(null);
  }

  setAuth(token: string, user: User) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.user.set(user);
  }

  requestSignupOtp(phone: string, email?: string): Observable<OtpResponse> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<OtpResponse>(`${this.API_URL}/auth/signup/request`, { phone, email });
  }

  verifySignupOtp(phone: string, code: string): Observable<OtpResponse> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<OtpResponse>(`${this.API_URL}/auth/signup/verify`, { phone, code });
  }

  completeSignup(data: { phone: string; fullName: string; pin: string; referralCode?: string; email?: string; code: string }): Observable<AuthResponse> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/signup/complete`, data);
  }

  requestLoginOtp(phone: string): Observable<OtpResponse> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<OtpResponse>(`${this.API_URL}/auth/login/request`, { phone });
  }

  verifyLoginOtp(phone: string, code: string): Observable<AuthResponse> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login/verify`, { phone, code });
  }

  loginWithPin(phone: string, pin: string): Observable<AuthResponse> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login/pin`, { phone, pin });
  }

  requestLoginEmailToken(email: string): Observable<OtpResponse> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<OtpResponse>(`${this.API_URL}/auth/login/email/request`, { email });
  }

  verifyLoginEmailToken(email: string, code: string): Observable<AuthResponse> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login/email/verify`, { email, code });
  }

  resendOtp(phone: string, purpose: 'signup' | 'login' | 'reset_pin' | 'verify_phone'): Observable<OtpResponse> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<OtpResponse>(`${this.API_URL}/auth/otp/resend`, { phone, purpose });
  }

  requestPinReset(phone: string): Observable<OtpResponse> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<OtpResponse>(`${this.API_URL}/auth/pin/reset/request`, { phone });
  }

  resetPin(phone: string, code: string, newPin: string): Observable<{ success: boolean; message?: string }> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<{ success: boolean; message?: string }>(`${this.API_URL}/auth/pin/reset`, { phone, code, newPin });
  }

  changePin(currentPin: string, newPin: string): Observable<{ success: boolean; message?: string }> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<{ success: boolean; message?: string }>(`${this.API_URL}/auth/pin/change`,
      { currentPin, newPin },
      { headers: { Authorization: `Bearer ${this.token()}` } }
    );
  }

  getProfile(): Observable<{ success: boolean; data: User }> {
    return this.http.get<{ success: boolean; data: User }>(`${this.API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${this.token()}` }
    });
  }

  updateProfile(data: { fullName?: string; email?: string }): Observable<{ success: boolean; data?: User; message?: string }> {
    return this.http.put<{ success: boolean; data: User }>(`${this.API_URL}/auth/profile`, data, {
      headers: { Authorization: `Bearer ${this.token()}` }
    });
  }

  verifyToken(): Observable<{ success: boolean; data: User }> {
    const token = this.token();
    if (!token) return new Observable(subscriber => subscriber.complete());
    
    return this.http.get<{ success: boolean; data: User }>(`${this.API_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  requestPhoneVerification(phone: string): Observable<OtpResponse> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<OtpResponse>(`${this.API_URL}/auth/verify-phone/request`, { phone });
  }

  confirmPhoneVerification(phone: string, code: string): Observable<{ success: boolean; message?: string; data?: { phoneVerified: boolean; user?: User } }> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<{ success: boolean; message?: string; data?: { phoneVerified: boolean; user?: User } }>(`${this.API_URL}/auth/verify-phone/confirm`, { phone, code });
  }

  getReferralStats(): Observable<{ success: boolean; data: { referralCode: string; totalReferrals: number; referralBonus: number; referrals: Array<{ fullName: string; createdAt: string }> } }> {
    return this.http.get<{ success: boolean; data: any }>(`${environment.apiUrl}/auth/referrals`, { headers: this.getAuthHeaders() });
  }

  checkReferralCode(code: string): Observable<{ success: boolean; data: { valid: boolean; referrer?: string } }> {
    return this.http.get<{ success: boolean; data: any }>(`${environment.apiUrl}/auth/referral/${code}`);
  }

  submitKyc(data: { type: 'bvn' | 'nin'; number: string }): Observable<{ success: boolean; message: string; data?: any }> {
    return this.http.post<{ success: boolean; message: string; data?: any }>(`${environment.apiUrl}/auth/kyc`, data, { headers: this.getAuthHeaders() });
  }

  getKycStatus(): Observable<{ success: boolean; data: { kycVerified: boolean; kycType: string | null; kycNumber: string | null; kycSubmittedAt: string | null; kycReviewedAt: string | null } }> {
    return this.http.get<{ success: boolean; data: any }>(`${environment.apiUrl}/auth/kyc`, { headers: this.getAuthHeaders() });
  }

  refreshToken(): Observable<{ success: boolean; token: string }> {
    const t = this.token();
    if (!t) return throwError(() => new Error('No token'));
    return this.http.post<{ success: boolean; token: string }>(
      `${this.API_URL}/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${t}` } }
    );
  }

  logout() {
    this.clearAuth();
    this.router.navigate(['/auth/login']);
  }

  getAuthHeaders() {
    return { Authorization: `Bearer ${this.token()}` };
  }

  chatWithOra(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]): Observable<{ success: boolean; data: { content: string } }> {
    return this.http.post<{ success: boolean; data: { content: string } }>(`${environment.apiUrl}/ai/chat`, { messages }, {
      headers: this.getAuthHeaders()
    });
  }
}
