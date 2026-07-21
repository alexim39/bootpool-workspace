import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, AuthResponse } from '../../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-mobile-pin-setup',
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
        <span class="header-logo"><span class="logo-bet">Bet</span><span class="logo-pool">Pool</span></span>
        <div style="width:44px"></div>
      </div>

      <div class="mobile-content">
        <h1 class="page-title">Set Up PIN</h1>
        <p class="page-subtitle">Create a 4-digit PIN to secure your account</p>

        <div class="field">
          <label class="field-label">Create PIN</label>
          <input class="field-input" type="password" [(ngModel)]="pin" placeholder="Create 4-digit PIN" maxlength="4" inputmode="numeric" />
        </div>

        <div class="field">
          <label class="field-label">Confirm PIN</label>
          <input class="field-input" type="password" [(ngModel)]="confirmPin" placeholder="Re-enter your PIN" maxlength="4" inputmode="numeric" />
        </div>

        @if (pinMismatch) {
          <div class="error-msg">PINs do not match</div>
        }

        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }
      </div>

      <div class="mobile-bottom">
        <button class="btn-primary" (click)="submitPin()" [disabled]="!canSubmit || loading()">
          @if (loading()) { <span class="spinner"></span> }
          Complete Setup
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .mobile-root { min-height: 100vh; background: #0A1428; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; }
    .mobile-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 0; }
    .back-btn { background: none; border: none; color: #FFFFFF; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 12px; }
    .back-btn:active { background: rgba(255,255,255,0.05); }
    .header-logo { font-size: 1.4rem; font-weight: 800; font-family: 'Exo-ExtraBold', 'Inter', sans-serif; }
    .logo-bet { background: linear-gradient(135deg, #00E676 0%, #00C853 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .logo-pool { background: linear-gradient(135deg, #E8B923 0%, #D4AF37 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .mobile-content { flex: 1; padding: 24px 20px; overflow-y: auto; }
    .page-title { color: #FFFFFF; font-size: 1.75rem; font-weight: 700; margin: 0 0 6px; }
    .page-subtitle { color: rgba(255,255,255,0.7); font-size: 1rem; margin: 0 0 36px; }
    .field { margin-bottom: 24px; }
    .field-label { color: rgba(255,255,255,0.7); font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; display: block; }
    .field-input { width: 100%; background: #162245; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px 18px; color: #FFFFFF; font-size: 1.3rem; outline: none; font-family: inherit; box-sizing: border-box; transition: border-color 0.2s ease; letter-spacing: 6px; }
    .field-input:focus { border-color: #00E676; box-shadow: 0 0 0 3px rgba(0,230,118,0.1); }
    .field-input::placeholder { color: rgba(255,255,255,0.3); letter-spacing: 0; }
    .error-msg { color: #FF5252; font-size: 0.85rem; text-align: center; padding: 10px 14px; background: rgba(255,82,82,0.1); border-radius: 10px; margin-top: 4px; }
    .mobile-bottom { padding: 16px 20px 32px; background: #0A1428; }
    .btn-primary { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 18px 24px; background: linear-gradient(135deg, #00E676 0%, #00C853 100%); color: #0A1428; font-weight: 700; font-size: 1.1rem; border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 20px rgba(0,230,118,0.3); }
    .btn-primary:active:not(:disabled) { transform: scale(0.98); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .spinner { width: 22px; height: 22px; border: 2.5px solid rgba(10,20,40,0.3); border-top-color: #0A1428; border-radius: 50%; animation: spin 0.6s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PinSetupComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  phone = signal<string>('');
  fullName = signal<string>('');
  email = signal<string>('');
  code = signal<string>('');
  pin = '';
  confirmPin = '';
  loading = signal(false);
  error = signal<string | null>(null);

  get canSubmit(): boolean {
    return this.pin.length === 4 && this.confirmPin.length === 4 && this.pin === this.confirmPin;
  }

  get pinMismatch(): boolean {
    return this.confirmPin.length === 4 && this.pin !== this.confirmPin;
  }

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras.state as { phone?: string; fullName?: string; email?: string; code?: string } | null;
    if (state?.phone) this.phone.set(state.phone);
    if (state?.fullName) this.fullName.set(state.fullName);
    if (state?.email) this.email.set(state.email);
    if (state?.code) this.code.set(state.code);
    if (!this.phone() && history.state?.phone) {
      this.phone.set(history.state.phone);
    }
  }

  goBack() { this.router.navigate(['/auth/verify-otp']); }

  submitPin() {
    if (!this.canSubmit) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.completeSignup({
      phone: this.phone(),
      fullName: this.fullName(),
      pin: this.pin.trim(),
      email: this.email() || undefined,
      code: this.code()
    }).pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: AuthResponse) => {
          if (res.success && (res.data || (res.token && res.user))) {
            const token = res.data?.token || res.token!;
            const user = res.data?.user || res.user!;
            this.auth.setAuth(token, user);
            this.router.navigate(['/home']);
          } else {
            this.error.set(res.message || 'Setup failed');
          }
        },
        error: (err: any) => this.error.set(err.error?.message || 'Failed to complete setup')
      });
  }
}
