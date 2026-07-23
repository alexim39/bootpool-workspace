import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, OtpResponse, AuthResponse } from '../../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-mobile-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="mobile-root">
      <div class="mobile-header">
        <button class="back-btn" (click)="goBack()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span class="header-logo">
          <img src="img/logo/logo.png" alt="BetPool Logo" class="logo-image">
          <span class="logo-bet">Bet</span>
          <span class="logo-pool">Pool</span>
        </span>
        <div style="width:44px"></div>
      </div>

      <div class="mobile-content">
        <h1 class="page-title">Welcome Back</h1>
        <p class="page-subtitle">Sign in to your account</p>

        <div class="mobile-tabs">
          <button class="tab-btn" [class.active]="loginMode() === 'pin'" (click)="loginMode.set('pin')">PIN</button>
          <button class="tab-btn" [class.active]="loginMode() === 'email'" (click)="loginMode.set('email')">Email</button>
          <button class="tab-btn" [class.active]="loginMode() === 'otp'" (click)="loginMode.set('otp')">OTP</button>
        </div>

        @if (loginMode() === 'pin') {
          <div class="field">
            <label class="field-label">Phone Number</label>
            <div class="phone-wrap">
              <span class="phone-prefix">+234</span>
              <input class="field-input" type="tel" [(ngModel)]="phone" placeholder="Enter your phone number" maxlength="10" inputmode="numeric" />
            </div>
          </div>
          <div class="field">
            <label class="field-label">PIN</label>
            <input class="field-input" type="password" [(ngModel)]="pin" placeholder="Enter your 4-digit PIN" maxlength="4" inputmode="numeric" />
          </div>
        } @else if (loginMode() === 'email') {
          @if (!emailTokenSent()) {
            <div class="field">
              <label class="field-label">Email Address</label>
              <input class="field-input" type="email" [(ngModel)]="email" placeholder="Enter your email address" />
            </div>
          } @else {
            <div class="field">
              <label class="field-label">Email Address</label>
              <input class="field-input" type="email" [(ngModel)]="email" disabled />
            </div>
            <div class="field">
              <label class="field-label">Token</label>
              <input class="field-input" type="text" [(ngModel)]="emailToken" placeholder="Enter 6-digit token" maxlength="6" inputmode="numeric" />
            </div>
          }
        } @else {
          <div class="field">
            <label class="field-label">Phone Number</label>
            <div class="phone-wrap">
              <span class="phone-prefix">+234</span>
              <input class="field-input" type="tel" [(ngModel)]="phone" placeholder="Enter your phone number" maxlength="10" inputmode="numeric" />
            </div>
          </div>
        }

        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }
      </div>

      <div class="mobile-bottom">
        @if (loginMode() === 'pin') {
          <button class="btn-primary" (click)="loginWithPin()" [disabled]="phone.length < 10 || pin.length < 4 || loading()">
            @if (loading()) { <span class="spinner"></span> }
            Login
          </button>
        } @else if (loginMode() === 'email') {
          @if (!emailTokenSent()) {
            <button class="btn-primary" (click)="sendEmailToken()" [disabled]="!email || loading()">
              @if (loading()) { <span class="spinner"></span> }
              Send Token
            </button>
          } @else {
            <button class="btn-primary" (click)="verifyEmailToken()" [disabled]="emailToken.length < 6 || loading()">
              @if (loading()) { <span class="spinner"></span> }
              Verify Token
            </button>
            <button class="link-btn" (click)="resetEmailToken()">Use a different email</button>
          }
        } @else {
          <button class="btn-primary" (click)="sendOtp()" [disabled]="phone.length < 10 || loading()">
            @if (loading()) { <span class="spinner"></span> }
            Send OTP
          </button>
        }
        <div class="bottom-text">
          Don't have an account? <a class="auth-link" (click)="goSignup()">Sign Up</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .mobile-root { min-height: 100vh; background: #0A1428; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; }
    .mobile-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 0; }
    .back-btn { background: none; border: none; color: #FFFFFF; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 12px; }
    .back-btn:active { background: rgba(255,255,255,0.05); }
    .header-logo { display: inline-flex; align-items: center; gap: 8px; font-size: 1.4rem; font-weight: 800; font-family: 'Exo-ExtraBold', 'Inter', sans-serif; line-height: 1; }
    .logo-image { height: 34px; width: 34px; object-fit: cover; display: block; border-radius: 10px; flex-shrink: 0; }
    .logo-bet { margin-right: -8px; background: linear-gradient(135deg, #00E676 0%, #00C853 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .logo-pool { background: linear-gradient(135deg, #E8B923 0%, #D4AF37 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .mobile-content { flex: 1; padding: 24px 20px; overflow-y: auto; }
    .page-title { color: #FFFFFF; font-size: 1.75rem; font-weight: 700; margin: 0 0 6px; }
    .page-subtitle { color: rgba(255,255,255,0.7); font-size: 1rem; margin: 0 0 32px; }
    .mobile-tabs { display: flex; gap: 8px; margin-bottom: 28px; background: #162245; border-radius: 12px; padding: 6px; }
    .tab-btn { flex: 1; padding: 14px 20px; background: transparent; color: rgba(255,255,255,0.5); border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
    .tab-btn.active { background: #0D1A30; color: #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .tab-btn:active:not(.active) { color: rgba(255,255,255,0.8); }
    .field { margin-bottom: 24px; }
    .field-label { color: rgba(255,255,255,0.7); font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; display: block; }
    .phone-wrap { display: flex; align-items: center; background: #162245; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; transition: border-color 0.2s ease; }
    .phone-wrap:focus-within { border-color: #00E676; box-shadow: 0 0 0 3px rgba(0,230,118,0.1); }
    .phone-prefix { padding: 16px 8px 16px 18px; color: rgba(255,255,255,0.7); font-size: 1rem; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); white-space: nowrap; }
    .field-input { flex: 1; background: transparent; border: none; padding: 16px 18px; color: #FFFFFF; font-size: 1rem; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; }
    .field-input::placeholder { color: rgba(255,255,255,0.3); }
    .field-input[type="password"] { letter-spacing: 4px; font-size: 1.3rem; }
    .field-input[disabled] { opacity: 0.5; }
    .link-btn { display: block; width: 100%; background: none; border: none; color: #00E676; font-size: 0.9rem; font-weight: 600; cursor: pointer; padding: 12px; text-align: center; font-family: inherit; }
    .link-btn:active { text-decoration: underline; }
    .error-msg { color: #FF5252; font-size: 0.85rem; text-align: center; padding: 10px 14px; background: rgba(255,82,82,0.1); border-radius: 10px; margin-top: 8px; }
    .mobile-bottom { padding: 16px 20px 32px; background: #0A1428; }
    .btn-primary { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 18px 24px; background: linear-gradient(135deg, #00E676 0%, #00C853 100%); color: #0A1428; font-weight: 700; font-size: 1.1rem; border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 20px rgba(0,230,118,0.3); }
    .btn-primary:active:not(:disabled) { transform: scale(0.98); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .spinner { width: 22px; height: 22px; border: 2.5px solid rgba(10,20,40,0.3); border-top-color: #0A1428; border-radius: 50%; animation: spin 0.6s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .bottom-text { text-align: center; margin-top: 20px; color: rgba(255,255,255,0.7); font-size: 0.9rem; }
    .auth-link { color: #00E676; text-decoration: none; font-weight: 600; cursor: pointer; }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  loginMode = signal<'otp' | 'pin' | 'email'>('pin');
  phone = '';
  pin = '';
  email = '';
  emailToken = '';
  emailTokenSent = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  goBack() { this.router.navigate(['/']); }

  goSignup() { this.router.navigate(['/auth/signup']); }

  sendOtp() {
    const phone = this.phone.trim();
    if (phone.length < 10) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.requestLoginOtp(phone)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: OtpResponse) => {
          if (res.success) {
            this.router.navigate(['/auth/verify-otp'], { state: { phone, purpose: 'login' } });
          } else {
            this.error.set(res.message || 'Failed to send OTP');
          }
        },
        error: (err: any) => this.error.set(err.error?.message || 'Failed to send OTP')
      });
  }

  loginWithPin() {
    const phone = this.phone.trim();
    const pin = this.pin.trim();
    if (phone.length < 10 || pin.length < 4) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.loginWithPin(phone, pin)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: AuthResponse) => {
          if (res.success && (res.data || (res.token && res.user))) {
            const token = res.data?.token || res.token!;
            const user = res.data?.user || res.user!;
            this.auth.setAuth(token, user);
            this.router.navigate(['/home']).then(navOk => {
              if (!navOk) this.error.set('Session expired, please try again');
            });
          } else {
            this.error.set(res.message || 'Login failed');
          }
        },
        error: (err: any) => this.error.set(err.error?.message || 'Invalid credentials')
      });
  }

  sendEmailToken() {
    const email = this.email.trim();
    if (!email) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.requestLoginEmailToken(email)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: OtpResponse) => {
          if (res.success) { this.emailTokenSent.set(true); }
          else { this.error.set(res.message || 'Failed to send token'); }
        },
        error: (err: any) => this.error.set(err.error?.message || 'Failed to send token')
      });
  }

  verifyEmailToken() {
    const email = this.email.trim();
    const code = this.emailToken.trim();
    if (code.length < 6) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.verifyLoginEmailToken(email, code)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: AuthResponse) => {
          if (res.success && (res.data || (res.token && res.user))) {
            const token = res.data?.token || res.token!;
            const user = res.data?.user || res.user!;
            this.auth.setAuth(token, user);
            this.router.navigate(['/home']);
          } else {
            this.error.set(res.message || 'Verification failed');
          }
        },
        error: (err: any) => this.error.set(err.error?.message || 'Invalid token')
      });
  }

  resetEmailToken() {
    this.emailTokenSent.set(false);
    this.emailToken = '';
    this.error.set(null);
  }
}
