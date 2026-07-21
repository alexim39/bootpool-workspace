import { Component, inject, signal, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, OtpResponse, AuthResponse } from '../../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';
import { interval, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-mobile-otp-verify',
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
          <span class="logo-bet">Bet</span><span class="logo-pool">Pool</span>
        </span>
        <div style="width:44px"></div>
      </div>

      <div class="mobile-content">
        <h1 class="page-title">Verify OTP</h1>
        <p class="page-subtitle">Enter the code sent to {{ phone() }}</p>

        <div class="otp-container">
          @for (idx of [0,1,2,3,4,5]; track idx) {
            <input
              class="otp-box"
              type="tel"
              maxlength="1"
              inputmode="numeric"
              autocomplete="one-time-code"
              (input)="onInput($event, idx)"
              (keydown)="onKeydown($event, idx)"
              (focus)="onFocus($event)"
              [value]="otpDigits[idx] || ''"
            />
          }
        </div>

        <div class="resend-row">
          @if (resendCountdown() > 0) {
            <span class="resend-timer">Resend in {{ resendCountdown() }}s</span>
          } @else {
            <button class="resend-btn" (click)="resendOtp()" [disabled]="loading()">Resend OTP</button>
          }
        </div>



        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }
      </div>

      <div class="mobile-bottom">
        <button class="btn-primary" (click)="verifyOtp()" [disabled]="otpDigits.join('').length < 6 || loading()">
          @if (loading()) { <span class="spinner"></span> }
          Verify OTP
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
    .header-logo { display: inline-flex; align-items: center; gap: 8px; font-size: 1.4rem; font-weight: 800; font-family: 'Exo-ExtraBold', 'Inter', sans-serif; line-height: 1; }
    .logo-image { height: 34px; width: 34px; object-fit: cover; display: block; border-radius: 10px; flex-shrink: 0; }
    .logo-bet { background: linear-gradient(135deg, #00E676 0%, #00C853 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .logo-pool { background: linear-gradient(135deg, #E8B923 0%, #D4AF37 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .mobile-content { flex: 1; padding: 24px 20px; overflow-y: auto; display: flex; flex-direction: column; align-items: center; }
    .page-title { color: #FFFFFF; font-size: 1.75rem; font-weight: 700; margin: 0 0 6px; text-align: center; }
    .page-subtitle { color: rgba(255,255,255,0.7); font-size: 1rem; margin: 0 0 36px; text-align: center; }
    .otp-container { display: flex; gap: 14px; justify-content: center; margin-bottom: 24px; }
    .otp-box { width: 48px; height: 58px; text-align: center; font-size: 1.5rem; font-weight: 700; color: #FFFFFF; background: #162245; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; outline: none; transition: all 0.2s ease; font-family: inherit; }
    .otp-box:focus { border-color: #00E676; box-shadow: 0 0 0 3px rgba(0,230,118,0.15); background: #1A2A50; }
    .resend-row { text-align: center; margin-bottom: 8px; }
    .resend-timer { color: rgba(255,255,255,0.5); font-size: 0.85rem; }
    .resend-btn { background: none; border: none; color: #00E676; font-size: 0.95rem; font-weight: 600; cursor: pointer; padding: 8px 16px; font-family: inherit; }
    .resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .error-msg { color: #FF5252; font-size: 0.85rem; text-align: center; padding: 10px 14px; background: rgba(255,82,82,0.1); border-radius: 10px; margin-top: 8px; width: 100%; }


    .mobile-bottom { padding: 16px 20px 32px; background: #0A1428; }
    .btn-primary { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 18px 24px; background: linear-gradient(135deg, #00E676 0%, #00C853 100%); color: #0A1428; font-weight: 700; font-size: 1.1rem; border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 20px rgba(0,230,118,0.3); }
    .btn-primary:active:not(:disabled) { transform: scale(0.98); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .spinner { width: 22px; height: 22px; border: 2.5px solid rgba(10,20,40,0.3); border-top-color: #0A1428; border-radius: 50%; animation: spin 0.6s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class OtpVerifyComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  phone = signal<string>('');
  fullName = signal<string>('');
  email = signal<string>('');
  purpose = signal<'login' | 'signup'>('signup');
  otpDigits: string[] = ['', '', '', '', '', ''];
  loading = signal(false);
  error = signal<string | null>(null);
  resendCountdown = signal(0);
  private timerSub: Subscription | null = null;

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras.state as { phone?: string; fullName?: string; email?: string; purpose?: 'login' | 'signup' } | null;
    if (state?.phone) this.phone.set(state.phone);
    if (state?.fullName) this.fullName.set(state.fullName);
    if (state?.email) this.email.set(state.email);
    if (state?.purpose) this.purpose.set(state.purpose);
    if (!this.phone() && history.state?.phone) {
      this.phone.set(history.state.phone);
    }
    this.startResendTimer();
  }

  goBack() { this.router.navigate(['/auth/login']); }

  onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '').slice(0, 1);
    input.value = digit;
    this.otpDigits[index] = digit;
    if (digit && index < 5) {
      const next = input.parentElement?.querySelectorAll('.otp-box')[index + 1] as HTMLInputElement;
      next?.focus();
    }
  }

  onKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      if (!this.otpDigits[index] && index > 0) {
        this.otpDigits[index - 1] = '';
        const prev = (event.target as HTMLElement).parentElement?.querySelectorAll('.otp-box')[index - 1] as HTMLInputElement;
        prev?.focus();
      } else {
        this.otpDigits[index] = '';
      }
    }
  }

  onFocus(event: FocusEvent) { (event.target as HTMLInputElement).select(); }

  verifyOtp() {
    const code = this.otpDigits.join('');
    if (code.length < 6) return;
    this.loading.set(true);
    this.error.set(null);

    if (this.purpose() === 'login') {
      this.auth.verifyLoginOtp(this.phone(), code)
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
          error: (err: any) => this.error.set(err.error?.message || 'Invalid OTP')
        });
    } else {
      this.auth.verifySignupOtp(this.phone(), code)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (res: OtpResponse) => {
            if (res.success) {
              this.router.navigate(['/auth/setup-pin'], { state: { phone: this.phone(), fullName: this.fullName(), email: this.email(), code } });
            } else {
              this.error.set(res.message || 'Invalid OTP');
            }
          },
          error: (err: any) => this.error.set(err.error?.message || 'Invalid OTP')
        });
    }
  }

  resendOtp() {
    this.loading.set(true);
    this.error.set(null);
    this.auth.resendOtp(this.phone(), this.purpose())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: any) => {
          this.otpDigits = ['', '', '', '', '', ''];
          this.startResendTimer();
          // resend successful — timer already restarted
        },
        error: (err: any) => this.error.set(err.error?.message || 'Failed to resend OTP')
      });
  }

  private startResendTimer() {
    this.timerSub?.unsubscribe();
    this.resendCountdown.set(60);
    this.timerSub = interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.resendCountdown.update(v => {
          if (v <= 1) { this.timerSub?.unsubscribe(); return 0; }
          return v - 1;
        });
      });
  }
}
