import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services';
import { finalize } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private _auth = inject(AuthService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly loginMode = signal<'otp' | 'pin' | 'email'>('pin');
  readonly emailTokenSent = signal(false);
  readonly resendCountdown = signal(0);

  readonly phone = signal<string>('');
  readonly fullName = signal<string>('');
  readonly email = signal<string>('');
  readonly code = signal<string>('');
  readonly purpose = signal<'login' | 'signup'>('signup');

  init(data: { phone?: string; fullName?: string; email?: string; purpose?: 'login' | 'signup'; code?: string }) {
    if (data.phone !== undefined) this.phone.set(data.phone);
    if (data.fullName !== undefined) this.fullName.set(data.fullName);
    if (data.email !== undefined) this.email.set(data.email);
    if (data.code !== undefined) this.code.set(data.code);
    if (data.purpose !== undefined) this.purpose.set(data.purpose);
    this.error.set(null);
  }

  sendOtp(phone: string, onSuccess: () => void) {
    this.loading.set(true);
    this.error.set(null);
    this._auth.requestLoginOtp(phone)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => onSuccess(),
        error: (err) => this.error.set(err.error?.message || 'Failed to send OTP')
      });
  }

  loginWithPin(phone: string, pin: string, onSuccess: () => void) {
    this.loading.set(true);
    this.error.set(null);
    this._auth.loginWithPin(phone, pin)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && (res.data || (res.token && res.user))) {
            const token = res.data?.token || res.token!;
            const user = res.data?.user || res.user!;
            this._auth.setAuth(token, user);
            onSuccess();
          } else {
            this.error.set(res.message || 'Login failed');
          }
        },
        error: (err) => this.error.set(err.error?.message || 'Invalid credentials')
      });
  }

  sendEmailToken(email: string, onSuccess: () => void) {
    this.loading.set(true);
    this.error.set(null);
    this._auth.requestLoginEmailToken(email)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => onSuccess(),
        error: (err) => this.error.set(err.error?.message || 'Failed to send token')
      });
  }

  verifyEmailToken(email: string, code: string, onSuccess: () => void) {
    this.loading.set(true);
    this.error.set(null);
    this._auth.verifyLoginEmailToken(email, code)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && (res.data || (res.token && res.user))) {
            const token = res.data?.token || res.token!;
            const user = res.data?.user || res.user!;
            this._auth.setAuth(token, user);
            onSuccess();
          } else {
            this.error.set(res.message || 'Verification failed');
          }
        },
        error: (err) => this.error.set(err.error?.message || 'Invalid token')
      });
  }

  resetEmailToken() {
    this.emailTokenSent.set(false);
    this.error.set(null);
  }

  requestSignupOtp(phone: string, email: string | undefined, onSuccess: () => void) {
    this.loading.set(true);
    this.error.set(null);
    this._auth.requestSignupOtp(phone, email)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            onSuccess();
          } else {
            this.error.set(res.message || 'Failed to create account');
          }
        },
        error: (err) => this.error.set(err.error?.message || 'Failed to create account')
      });
  }

  verifyOtp(code: string, onLoginSuccess: () => void, onSignupSuccess: (code: string) => void) {
    this.loading.set(true);
    this.error.set(null);

    if (this.purpose() === 'login') {
      this._auth.verifyLoginOtp(this.phone(), code)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.success && (res.data || (res.token && res.user))) {
              const token = res.data?.token || res.token!;
              const user = res.data?.user || res.user!;
              this._auth.setAuth(token, user);
              onLoginSuccess();
            } else {
              this.error.set(res.message || 'Verification failed');
            }
          },
          error: (err) => this.error.set(err.error?.message || 'Invalid OTP')
        });
    } else {
      this._auth.verifySignupOtp(this.phone(), code)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => onSignupSuccess(code),
          error: (err) => this.error.set(err.error?.message || 'Invalid OTP')
        });
    }
  }

  resendOtp(onSuccess: () => void) {
    this.loading.set(true);
    this.error.set(null);
    this._auth.resendOtp(this.phone(), this.purpose())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => onSuccess(),
        error: (err) => this.error.set(err.error?.message || 'Failed to resend OTP')
      });
  }

  completeSignup(data: { phone: string; fullName: string; pin: string; email?: string; code: string }, onSuccess: () => void) {
    this.loading.set(true);
    this.error.set(null);
    this._auth.completeSignup(data)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && (res.data || (res.token && res.user))) {
            const token = res.data?.token || res.token!;
            const user = res.data?.user || res.user!;
            this._auth.setAuth(token, user);
            onSuccess();
          } else {
            this.error.set(res.message || 'Setup failed');
          }
        },
        error: (err) => this.error.set(err.error?.message || 'Failed to complete setup')
      });
  }

  logout() {
    this._auth.logout();
  }
}
