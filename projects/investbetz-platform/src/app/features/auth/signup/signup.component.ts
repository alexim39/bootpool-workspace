import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-signup',
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
        <h1 class="auth-title">Create Account</h1>
        <p class="auth-subtitle">Join the BetPool community</p>

        <div class="field">
          <label class="field-label">Full Name</label>
          <input class="field-input" type="text" [(ngModel)]="fullName" placeholder="Enter your full name" maxlength="50" />
        </div>

        <div class="field">
          <label class="field-label">Phone Number</label>
          <div class="phone-wrap">
            <span class="phone-prefix">+234</span>
            <input class="field-input" type="tel" [(ngModel)]="phone" placeholder="Enter your phone number" maxlength="10" inputmode="numeric" />
          </div>
        </div>

        <div class="field">
          <label class="field-label">Email (optional)</label>
          <input class="field-input" type="email" [(ngModel)]="email" placeholder="Enter your email address" />
          <span class="field-hint">Your verification code will also be sent to this email</span>
        </div>

        <div class="terms-row" (click)="toggleTerms()">
          <div class="terms-checkbox" [class.checked]="termsAccepted">
            @if (termsAccepted) {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A1428" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
          </div>
          <span class="terms-text">
            I accept the <a class="terms-link" href="#" (click)="$event.preventDefault()">Terms of Service</a> and <a class="terms-link" href="#" (click)="$event.preventDefault()">Privacy Policy</a>
          </span>
        </div>

        <button class="btn-primary" (click)="createAccount()" [disabled]="!isFormValid || loading()">
          @if (loading()) { <span class="spinner"></span> }
          Create Account
        </button>

        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }

        <div class="auth-footer">
          Already have an account? <a class="auth-link" routerLink="/auth/login">Sign In</a>
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
    .logo-bet { margin-right: -7px !important; font-family: 'Exo-ExtraBold', 'Inter', sans-serif; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #00E676 0%, #00C853 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .logo-pool { font-family: 'Exo-ExtraBold', 'Inter', sans-serif; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #E8B923 0%, #D4AF37 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .auth-title { color: #FFFFFF; font-size: 1.5rem; font-weight: 700; text-align: center; margin: 0 0 4px; }
    .auth-subtitle { color: rgba(255,255,255,0.7); font-size: 0.875rem; text-align: center; margin: 0 0 28px; }
    .field { margin-bottom: 20px; }
    .field-label { color: rgba(255,255,255,0.7); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: block; }
    .phone-wrap { display: flex; align-items: center; background: #162245; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; transition: border-color 0.2s ease; }
    .phone-wrap:focus-within { border-color: #00E676; box-shadow: 0 0 0 3px rgba(0,230,118,0.1); }
    .phone-prefix { padding: 12px 8px 12px 16px; color: rgba(255,255,255,0.7); font-size: 0.875rem; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); white-space: nowrap; }
    .field-input { flex: 1; background: #162245; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px 16px; color: #FFFFFF; font-size: 0.875rem; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; transition: border-color 0.2s ease; }
    .field-input:focus { border-color: #00E676; box-shadow: 0 0 0 3px rgba(0,230,118,0.1); }
    .field-input::placeholder { color: rgba(255,255,255,0.3); }
    .field-hint { display: block; color: rgba(255,255,255,0.4); font-size: 0.72rem; margin-top: 6px; line-height: 1.4; }
    .terms-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px; cursor: pointer; }
    .terms-checkbox { width: 22px; height: 22px; min-width: 22px; border: 2px solid rgba(255,255,255,0.2); border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; background: transparent; }
    .terms-checkbox.checked { border-color: #E8B923; background: linear-gradient(135deg, #E8B923 0%, #D4AF37 100%); }
    .terms-text { color: rgba(255,255,255,0.7); font-size: 0.8rem; line-height: 1.5; }
    .terms-link { color: #E8B923; text-decoration: none; font-weight: 600; }
    .terms-link:hover { text-decoration: underline; }
    .btn-primary { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px 24px; background: linear-gradient(135deg, #00E676 0%, #00C853 100%); color: #0A1428; font-weight: 700; font-size: 1rem; border: none; border-radius: 10px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 16px rgba(0,230,118,0.3); margin-bottom: 16px; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,230,118,0.4); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
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
export class SignupComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  phone = '';
  fullName = '';
  email = '';
  termsAccepted = false;
  loading = signal(false);
  error = signal<string | null>(null);

  get isFormValid(): boolean {
    return this.fullName.trim().length >= 2 && this.phone.trim().length >= 10 && this.termsAccepted;
  }

  toggleTerms() {
    this.termsAccepted = !this.termsAccepted;
  }

  createAccount() {
    if (!this.isFormValid) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.requestSignupOtp(this.phone.trim(), this.email.trim() || undefined)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: any) => this.router.navigate(['/auth/verify-otp'], { state: { phone: this.phone.trim(), fullName: this.fullName.trim(), email: this.email.trim(), purpose: 'signup' } }),
        error: (err) => this.error.set(err.error?.message || 'Failed to create account')
      });
  }
}
