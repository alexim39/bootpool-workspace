import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-pin-setup',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="auth-root">
      <div class="auth-card">
        <div class="logo">
          <span class="logo-bet">Bet</span><span class="logo-pool">Pool</span>
        </div>
        <h1 class="auth-title">Set Up PIN</h1>
        <p class="auth-subtitle">Create a 4-digit PIN to secure your account</p>

        <div class="field">
          <label class="field-label">Create PIN</label>
          <input class="field-input" type="password" [(ngModel)]="pin" placeholder="Enter 4-digit PIN" maxlength="4" inputmode="numeric" />
        </div>

        <div class="field">
          <label class="field-label">Confirm PIN</label>
          <input class="field-input" type="password" [(ngModel)]="confirmPin" placeholder="Re-enter PIN" maxlength="4" inputmode="numeric" />
        </div>

        @if (pinMismatch) {
          <div class="error-msg">PINs do not match</div>
        }

        <button class="btn-primary" (click)="submitPin()" [disabled]="!canSubmit || loading()">
          @if (loading()) { <span class="spinner"></span> }
          Complete Setup
        </button>

        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #0A1428; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .auth-root { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
    .auth-card { background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); padding: 40px; width: 100%; max-width: 420px; }
    .logo { text-align: center; margin-bottom: 28px; }
    .logo-bet { font-family: 'Exo-ExtraBold', 'Inter', sans-serif; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #00E676 0%, #00C853 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .logo-pool { font-family: 'Exo-ExtraBold', 'Inter', sans-serif; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #E8B923 0%, #D4AF37 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .auth-title { color: #FFFFFF; font-size: 1.5rem; font-weight: 700; text-align: center; margin: 0 0 4px; }
    .auth-subtitle { color: rgba(255,255,255,0.7); font-size: 0.875rem; text-align: center; margin: 0 0 32px; }
    .field { margin-bottom: 20px; }
    .field-label { color: rgba(255,255,255,0.7); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: block; }
    .field-input { width: 100%; background: #162245; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px 16px; color: #FFFFFF; font-size: 1.2rem; outline: none; font-family: inherit; box-sizing: border-box; transition: border-color 0.2s ease; letter-spacing: 4px; }
    .field-input:focus { border-color: #00E676; box-shadow: 0 0 0 3px rgba(0,230,118,0.1); }
    .field-input::placeholder { color: rgba(255,255,255,0.3); letter-spacing: 0; }
    .btn-primary { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px 24px; background: linear-gradient(135deg, #00E676 0%, #00C853 100%); color: #0A1428; font-weight: 700; font-size: 1rem; border: none; border-radius: 10px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 16px rgba(0,230,118,0.3); margin-top: 8px; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,230,118,0.4); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .spinner { width: 18px; height: 18px; border: 2px solid rgba(10,20,40,0.3); border-top-color: #0A1428; border-radius: 50%; animation: spin 0.6s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-msg { color: #FF5252; font-size: 0.8rem; text-align: center; margin-bottom: 16px; padding: 8px 12px; background: rgba(255,82,82,0.1); border-radius: 8px; }
    @media (max-width: 480px) {
      .auth-card { padding: 24px 20px; border-radius: 12px; }
      .logo-bet, .logo-pool { font-size: 1.6rem; }
      .auth-title { font-size: 1.25rem; }
    }
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
        next: (res) => {
          if (res.success && (res.data || (res.token && res.user))) {
            const token = res.data?.token || res.token!;
            const user = res.data?.user || res.user!;
            this.auth.setAuth(token, user);
            this.router.navigate(['/home']);
          } else {
            this.error.set(res.message || 'Setup failed');
          }
        },
        error: (err) => this.error.set(err.error?.message || 'Failed to complete setup')
      });
  }
}
