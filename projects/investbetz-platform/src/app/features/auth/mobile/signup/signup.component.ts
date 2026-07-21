import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, OtpResponse } from '../../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-mobile-signup',
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
        <h1 class="page-title">Create Account</h1>
        <p class="page-subtitle">Join the BetPool community</p>

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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A1428" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
          </div>
          <span class="terms-text">
            I accept the <a class="terms-link" href="#" (click)="$event.preventDefault()">Terms</a> and <a class="terms-link" href="#" (click)="$event.preventDefault()">Privacy Policy</a>
          </span>
        </div>

        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }
      </div>

      <div class="mobile-bottom">
        <button class="btn-primary" (click)="createAccount()" [disabled]="!isFormValid || loading()">
          @if (loading()) { <span class="spinner"></span> }
          Create Account
        </button>
        <div class="bottom-text">
          Already have an account? <a class="auth-link" (click)="goLogin()">Sign In</a>
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
    .logo-bet { background: linear-gradient(135deg, #00E676 0%, #00C853 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .logo-pool { background: linear-gradient(135deg, #E8B923 0%, #D4AF37 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .mobile-content { flex: 1; padding: 24px 20px; overflow-y: auto; }
    .page-title { color: #FFFFFF; font-size: 1.75rem; font-weight: 700; margin: 0 0 6px; }
    .page-subtitle { color: rgba(255,255,255,0.7); font-size: 1rem; margin: 0 0 32px; }
    .field { margin-bottom: 24px; }
    .field-label { color: rgba(255,255,255,0.7); font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; display: block; }
    .phone-wrap { display: flex; align-items: center; background: #162245; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; transition: border-color 0.2s ease; }
    .phone-wrap:focus-within { border-color: #00E676; box-shadow: 0 0 0 3px rgba(0,230,118,0.1); }
    .phone-prefix { padding: 16px 8px 16px 18px; color: rgba(255,255,255,0.7); font-size: 1rem; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); white-space: nowrap; }
    .field-input { width: 100%; background: #162245; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px 18px; color: #FFFFFF; font-size: 1rem; outline: none; font-family: inherit; box-sizing: border-box; transition: border-color 0.2s ease; }
    .field-input:focus { border-color: #00E676; box-shadow: 0 0 0 3px rgba(0,230,118,0.1); }
    .field-input::placeholder { color: rgba(255,255,255,0.3); }
    .field-hint { display: block; color: rgba(255,255,255,0.4); font-size: 0.78rem; margin-top: 6px; line-height: 1.4; }
    .terms-row { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 8px; cursor: pointer; padding: 4px 0; }
    .terms-checkbox { width: 26px; height: 26px; min-width: 26px; border: 2px solid rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; background: transparent; }
    .terms-checkbox.checked { border-color: #E8B923; background: linear-gradient(135deg, #E8B923 0%, #D4AF37 100%); }
    .terms-text { color: rgba(255,255,255,0.7); font-size: 0.85rem; line-height: 1.5; padding-top: 2px; }
    .terms-link { color: #E8B923; text-decoration: none; font-weight: 600; }
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

  goBack() { this.router.navigate(['/auth/login']); }

  goLogin() { this.router.navigate(['/auth/login']); }

  toggleTerms() { this.termsAccepted = !this.termsAccepted; }

  createAccount() {
    if (!this.isFormValid) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.requestSignupOtp(this.phone.trim(), this.email.trim() || undefined)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: OtpResponse) => {
          if (res.success) {
            this.router.navigate(['/auth/verify-otp'], { state: { phone: this.phone.trim(), fullName: this.fullName.trim(), email: this.email.trim(), purpose: 'signup' } });
          } else {
            this.error.set(res.message || 'Failed to create account');
          }
        },
        error: (err: any) => this.error.set(err.error?.message || 'Failed to create account')
      });
  }
}
