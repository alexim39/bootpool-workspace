import { Component, signal, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AdminAuthService } from './';
import { environment } from '../../environments/environment';

type AuthStep = 'email' | 'token' | 'pin' | 'otp';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [NgIf, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent {
  private http = inject(HttpClient);
  private auth = inject(AdminAuthService);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  step = signal<AuthStep>('email');
  email = '';
  token = '';
  pin = '';
  code = '';
  error = signal('');
  loading = signal(false);

  sendToken() {
    if (!this.email || !this.email.includes('@')) {
      this.error.set('Enter a valid email address');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.http.post(`${this.apiUrl}/auth/login/email/request`, { email: this.email }).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set('token');
        this.token = '';
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to send token');
      }
    });
  }

  verifyToken() {
    if (!this.token || this.token.length < 6) {
      this.error.set('Enter the 6-digit token');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.http.post<{ success: boolean; data?: { token: string }; message?: string }>(
      `${this.apiUrl}/auth/login/email/verify`, { email: this.email, code: this.token }
    ).subscribe({
      next: res => {
        if (res.success && res.data?.token) {
          localStorage.setItem('ib_token', res.data.token);
          this.auth.loginWithToken(res.data.token).subscribe(ok => {
            this.loading.set(false);
            if (!ok) {
              this.error.set('Access denied: Admin privileges required');
              this.clearStorage();
            }
          });
        } else {
          this.loading.set(false);
          this.error.set(res.message || 'Invalid token');
        }
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Verification failed');
      }
    });
  }

  resendToken() {
    this.sendToken();
  }

  loginWithPin() {
    if (!this.pin || this.pin.length < 4 || this.pin.length > 6) {
      this.error.set('PIN must be 4 to 6 digits');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.http.post<{ success: boolean; data?: { token: string }; message?: string }>(
      `${this.apiUrl}/auth/login/pin`, { email: this.email, pin: this.pin }
    ).subscribe({
      next: res => {
        if (res.success && res.data?.token) {
          localStorage.setItem('ib_token', res.data.token);
          this.auth.loginWithToken(res.data.token).subscribe(ok => {
            this.loading.set(false);
            if (!ok) {
              this.error.set('Access denied: Admin privileges required');
              this.clearStorage();
            }
          });
        } else {
          this.loading.set(false);
          this.error.set(res.message || 'Invalid credentials');
        }
      },
      error: err => {
        this.loading.set(false);
        const msg = err.error?.message || 'Invalid email or PIN';
        this.error.set(msg);
      }
    });
  }

  requestOtp() {
    this.loading.set(true);
    this.error.set('');
    this.http.post(`${this.apiUrl}/auth/login/request`, { email: this.email }).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set('otp');
        this.code = '';
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to send OTP');
      }
    });
  }

  loginWithOtp() {
    if (!this.code || this.code.length < 4) {
      this.error.set('Enter the verification code');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.http.post<{ success: boolean; data?: { token: string }; message?: string }>(
      `${this.apiUrl}/auth/login/verify`, { email: this.email, code: this.code }
    ).subscribe({
      next: res => {
        if (res.success && res.data?.token) {
          localStorage.setItem('ib_token', res.data.token);
          this.auth.loginWithToken(res.data.token).subscribe(ok => {
            this.loading.set(false);
            if (!ok) {
              this.error.set('Access denied: Admin privileges required');
              this.clearStorage();
            }
          });
        } else {
          this.loading.set(false);
          this.error.set(res.message || 'Invalid code');
        }
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Verification failed');
      }
    });
  }

  private clearStorage() {
    localStorage.removeItem('ib_token');
    this.step.set('email');
  }
}
