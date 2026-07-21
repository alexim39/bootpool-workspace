import { Component, signal, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AdminAuthService } from './admin-auth.service';
import { environment } from '../../environments/environment';

type AuthStep = 'email' | 'token' | 'pin' | 'otp';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [NgIf, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <div class="logo"><span class="logo-icon">B</span></div>
          <h1>BetPool Admin</h1>
          <p class="subtitle">Secure administration panel</p>
        </div>

        <!-- Step 1: Email -->
        <div class="login-body" *ngIf="step() === 'email'">
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Email address</mat-label>
            <input matInput type="email" [(ngModel)]="email" placeholder="admin@betpool.tech" (keyup.enter)="sendToken()" (input)="error.set('')">
          </mat-form-field>
          <button mat-raised-button class="btn-primary full-width" (click)="sendToken()" [disabled]="!email || loading()">
            <span *ngIf="!loading()">Send Token</span>
            <span *ngIf="loading()">Sending...</span>
          </button>
          <div class="action-links">
            <button mat-button class="link-btn" (click)="step.set('pin'); error.set('')">Sign in with PIN instead</button>
          </div>
          <div class="error-msg" *ngIf="error()">{{ error() }}</div>
        </div>

        <!-- Step 2: Token -->
        <div class="login-body" *ngIf="step() === 'token'">
          <div class="step-hint">Token sent to {{ email }}</div>
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Enter 6-digit token</mat-label>
            <input matInput type="text" [(ngModel)]="token" placeholder="******" maxlength="6" inputmode="numeric" (keyup.enter)="verifyToken()" (input)="error.set('')">
          </mat-form-field>
          <button mat-raised-button class="btn-primary full-width" (click)="verifyToken()" [disabled]="(token||'').length < 6 || loading()">
            <span *ngIf="!loading()">Verify & Sign In</span>
            <span *ngIf="loading()">Verifying...</span>
          </button>
          <div class="action-links">
            <button mat-button class="link-btn" (click)="step.set('email'); token=''; error.set('')">Use a different email</button>
            <button mat-button class="link-btn" (click)="resendToken()" [disabled]="loading()">Resend token</button>
          </div>
          <div class="error-msg" *ngIf="error()">{{ error() }}</div>
        </div>

        <!-- Step 3: PIN (alternative) -->
        <div class="login-body" *ngIf="step() === 'pin'">
          <div class="step-hint">{{ email }}</div>
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Enter your PIN (4-6 digits)</mat-label>
            <input matInput type="password" [(ngModel)]="pin" placeholder="******" maxlength="6" inputmode="numeric" (keyup.enter)="loginWithPin()" (input)="error.set('')">
          </mat-form-field>
          <button mat-raised-button class="btn-primary full-width" (click)="loginWithPin()" [disabled]="(pin||'').length < 4 || loading()">
            <span *ngIf="!loading()">Sign In</span>
            <span *ngIf="loading()">Verifying...</span>
          </button>
          <div class="action-links">
            <button mat-button class="link-btn" (click)="requestOtp()">Forgot PIN? Use OTP instead</button>
            <button mat-button class="link-btn" (click)="step.set('email'); error.set('')">Back to email login</button>
          </div>
          <div class="error-msg" *ngIf="error()">{{ error() }}</div>
        </div>

        <!-- Step 4: OTP (fallback) -->
        <div class="login-body" *ngIf="step() === 'otp'">
          <div class="step-hint">Code sent to {{ email }}</div>
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Enter 6-digit code</mat-label>
            <input matInput type="text" [(ngModel)]="code" placeholder="******" maxlength="6" (keyup.enter)="loginWithOtp()" (input)="error.set('')">
          </mat-form-field>
          <button mat-raised-button class="btn-primary full-width" (click)="loginWithOtp()" [disabled]="(code||'').length < 4 || loading()">
            <span *ngIf="!loading()">Verify & Sign In</span>
            <span *ngIf="loading()">Verifying...</span>
          </button>
          <div class="action-links">
            <button mat-button class="link-btn" (click)="step.set('pin'); error.set('')">Back to PIN login</button>
          </div>
          <div class="error-msg" *ngIf="error()">{{ error() }}</div>
        </div>

        <div class="login-footer">
          <span class="lock-icon"><mat-icon>lock</mat-icon></span>
          <span>Email token / PIN login &bull; JWT secured</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0A1428; padding: 16px; }
    .login-card { background: #0D1A30; border-radius: 16px; width: 100%; max-width: 400px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; }
    .login-header { text-align: center; padding: 32px 24px 16px; }
    .logo { margin-bottom: 16px; }
    .logo-icon { width: 56px; height: 56px; background: #00E676; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 26px; color: #0A1428; }
    .login-header h1 { color: #fff; font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    .subtitle { color: rgba(255,255,255,0.4); font-size: 13px; margin: 0; }
    .login-body { padding: 0 24px 24px; display: flex; flex-direction: column; gap: 12px; }
    .full-width { width: 100%; }
    .step-hint { color: rgba(255,255,255,0.5); font-size: 13px; text-align: center; padding: 4px 0; word-break: break-all; }
    .btn-primary { background: #00E676 !important; color: #0A1428 !important; font-weight: 600; height: 48px; font-size: 15px; }
    .btn-primary:disabled { opacity: 0.4; }
    .action-links { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .link-btn { color: rgba(255,255,255,0.5) !important; font-size: 12px !important; }
    .error-msg { color: #f44336; font-size: 13px; text-align: center; padding: 8px; background: rgba(244,67,54,0.1); border-radius: 8px; }
    .login-footer { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); font-size: 12px; }
    .login-footer mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .loading-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(10,20,40,0.2); border-top-color: #0A1428; border-radius: 50%; animation: spin 0.6s linear infinite; margin-left: 8px; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
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
