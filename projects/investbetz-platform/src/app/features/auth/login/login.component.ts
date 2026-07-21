import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-root">
      <div class="auth-card">
        <button class="close-btn" routerLink="/" aria-label="Close and return home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="logo">
          <img src="img/logo/logo.png" alt="BetPool Logo" class="logo-image">
          <span class="logo-bet">Bet</span>
          <span class="logo-pool">Pool</span>
        </div>
        <h1 class="auth-title">Welcome Back</h1>
        <p class="auth-subtitle">Sign in to your account</p>

        <div class="tab-bar">
          <button class="tab-btn" [class.active]="loginMode() === 'pin'" (click)="loginMode.set('pin')">PIN</button>
          <button class="tab-btn" [class.active]="loginMode() === 'email'" (click)="loginMode.set('email')">Email Token</button>
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
          <button class="btn-primary" (click)="loginWithPin()" [disabled]="phone.length < 10 || pin.length < 4 || loading()">
            @if (loading()) { <span class="spinner"></span> }
            Login
          </button>
        } @else if (loginMode() === 'email') {
          @if (!emailTokenSent()) {
            <div class="field">
              <label class="field-label">Email Address</label>
              <input class="field-input" type="email" [(ngModel)]="email" placeholder="Enter your email address" />
            </div>
            <button class="btn-primary" (click)="sendEmailToken()" [disabled]="!email || loading()">
              @if (loading()) { <span class="spinner"></span> }
              Send Token
            </button>
          } @else {
            <div class="field">
              <label class="field-label">Email Address</label>
              <input class="field-input" type="email" [(ngModel)]="email" disabled />
            </div>
            <div class="field">
              <label class="field-label">Token</label>
              <input class="field-input" type="text" [(ngModel)]="emailToken" placeholder="Enter 6-digit token" maxlength="6" inputmode="numeric" />
            </div>
            <button class="btn-primary" (click)="verifyEmailToken()" [disabled]="emailToken.length < 6 || loading()">
              @if (loading()) { <span class="spinner"></span> }
              Verify Token
            </button>
            <button class="link-btn" (click)="resetEmailToken()">Use a different email</button>
          }
        } @else {
          <div class="field">
            <label class="field-label">Phone Number</label>
            <div class="phone-wrap">
              <span class="phone-prefix">+234</span>
              <input class="field-input" type="tel" [(ngModel)]="phone" placeholder="Enter your phone number" maxlength="10" inputmode="numeric" />
            </div>
          </div>
          <button class="btn-primary" (click)="sendOtp()" [disabled]="phone.length < 10 || loading()">
            @if (loading()) { <span class="spinner"></span> }
            Send OTP
          </button>
        }

        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }

        <div class="auth-footer">
          Don't have an account? <a class="auth-link" routerLink="/auth/signup">Sign Up</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #0A1428; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .auth-root { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
    .auth-card { position: relative; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); padding: 40px; width: 100%; max-width: 420px; }
    .close-btn { position: absolute; top: 12px; right: 12px; width: 36px; height: 36px; border: none; border-radius: 50%; background: rgba(255,255,255,0.08); color: #FFFFFF; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; }
    .close-btn:hover { background: rgba(255,255,255,0.16); transform: translateY(-1px); }
    .logo { display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 28px; }
    .logo-image { height: 42px; width: auto; object-fit: contain; display: block; border-radius: 10px; }
    .logo-bet { font-family: 'Exo-ExtraBold', 'Inter', sans-serif; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #00E676 0%, #00C853 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .logo-pool { font-family: 'Exo-ExtraBold', 'Inter', sans-serif; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #E8B923 0%, #D4AF37 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .auth-title { color: #FFFFFF; font-size: 1.5rem; font-weight: 700; text-align: center; margin: 0 0 4px; }
    .auth-subtitle { color: rgba(255,255,255,0.7); font-size: 0.875rem; text-align: center; margin: 0 0 28px; }
    .tab-bar { display: flex; gap: 8px; margin-bottom: 24px; background: #162245; border-radius: 10px; padding: 4px; }
    .tab-btn { flex: 1; padding: 10px 16px; background: transparent; color: rgba(255,255,255,0.5); border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
    .tab-btn.active { background: #0D1A30; color: #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .tab-btn:hover:not(.active) { color: rgba(255,255,255,0.8); }
    .field { margin-bottom: 20px; }
    .field-label { color: rgba(255,255,255,0.7); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: block; }
    .phone-wrap { display: flex; align-items: center; background: #162245; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; transition: border-color 0.2s ease; }
    .phone-wrap:focus-within { border-color: #00E676; box-shadow: 0 0 0 3px rgba(0,230,118,0.1); }
    .phone-prefix { padding: 12px 8px 12px 16px; color: rgba(255,255,255,0.7); font-size: 0.875rem; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); white-space: nowrap; }
    .field-input { flex: 1; background: transparent; border: none; padding: 12px 16px; color: #FFFFFF; font-size: 0.875rem; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; }
    .field-input::placeholder { color: rgba(255,255,255,0.3); }
    .field-input[type="password"] { letter-spacing: 4px; font-size: 1.2rem; }
    .field-input[disabled] { opacity: 0.5; }
    .btn-primary { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px 24px; background: linear-gradient(135deg, #00E676 0%, #00C853 100%); color: #0A1428; font-weight: 700; font-size: 1rem; border: none; border-radius: 10px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 16px rgba(0,230,118,0.3); margin-bottom: 16px; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,230,118,0.4); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .link-btn { display: block; width: 100%; background: none; border: none; color: #00E676; font-size: 0.8rem; font-weight: 600; cursor: pointer; padding: 8px; text-align: center; font-family: inherit; margin-bottom: 16px; }
    .link-btn:hover { text-decoration: underline; }
    .spinner { width: 18px; height: 18px; border: 2px solid rgba(10,20,40,0.3); border-top-color: #0A1428; border-radius: 50%; animation: spin 0.6s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-msg { color: #FF5252; font-size: 0.8rem; text-align: center; margin-bottom: 16px; padding: 8px 12px; background: rgba(255,82,82,0.1); border-radius: 8px; }
    .auth-footer { text-align: center; color: rgba(255,255,255,0.7); font-size: 0.8rem; }
    .auth-link { color: #00E676; text-decoration: none; font-weight: 600; cursor: pointer; }
    .auth-link:hover { text-decoration: underline; }
    @media (max-width: 480px) {
      .auth-card { padding: 24px 20px; border-radius: 12px; }
      .logo-bet, .logo-pool { font-size: 1.6rem; }
      .auth-title { font-size: 1.25rem; }
    }
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

  sendOtp() {
    const phone = this.phone.trim();
    if (phone.length < 10) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.requestLoginOtp(phone)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: any) => this.router.navigate(['/auth/verify-otp'], { state: { phone, purpose: 'login' } }),
        error: (err) => this.error.set(err.error?.message || 'Failed to send OTP')
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
        next: (res) => {
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
        error: (err) => this.error.set(err.error?.message || 'Invalid credentials')
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
        next: () => { this.emailTokenSent.set(true); },
        error: (err) => this.error.set(err.error?.message || 'Failed to send token')
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
        next: (res) => {
          if (res.success && (res.data || (res.token && res.user))) {
            const token = res.data?.token || res.token!;
            const user = res.data?.user || res.user!;
            this.auth.setAuth(token, user);
            this.router.navigate(['/home']);
          } else {
            this.error.set(res.message || 'Verification failed');
          }
        },
        error: (err) => this.error.set(err.error?.message || 'Invalid token')
      });
  }

  resetEmailToken() {
    this.emailTokenSent.set(false);
    this.emailToken = '';
    this.error.set(null);
  }
}
