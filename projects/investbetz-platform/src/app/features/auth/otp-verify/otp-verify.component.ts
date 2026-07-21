import { Component, inject, signal, effect, OnInit, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';
import { interval, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-otp-verify',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="auth-root">
      <div class="auth-card">
        <div class="logo">
          <img src="img/logo/logo.png" alt="BetPool Logo" class="logo-image">
          <span class="logo-bet">Bet</span><span class="logo-pool">Pool</span>
        </div>
        <h1 class="auth-title">Verify OTP</h1>
        <p class="auth-subtitle">Enter the 6-digit code sent to {{ phone() }}</p>

        <div class="otp-container">
          @for (idx of [0,1,2,3,4,5]; track idx) {
            <input
              #otpInput
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

        <button class="btn-primary" (click)="verifyOtp()" [disabled]="otpDigits.join('').length < 6 || loading()">
          @if (loading()) { <span class="spinner"></span> }
          Verify OTP
        </button>

        <div class="resend-row">
          @if (resendCountdown() > 0) {
            <span class="resend-timer">Resend code in {{ resendCountdown() }}s</span>
          } @else {
            <button class="resend-btn" (click)="resendOtp()" [disabled]="loading()">Resend OTP</button>
          }
        </div>

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
    .logo { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 28px; }
    .logo-image { height: 42px; width: 42px; object-fit: cover; display: block; border-radius: 10px; flex-shrink: 0; }
    .logo-bet { font-family: 'Exo-ExtraBold', 'Inter', sans-serif; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #00E676 0%, #00C853 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .logo-pool { font-family: 'Exo-ExtraBold', 'Inter', sans-serif; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #E8B923 0%, #D4AF37 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .auth-title { color: #FFFFFF; font-size: 1.5rem; font-weight: 700; text-align: center; margin: 0 0 4px; }
    .auth-subtitle { color: rgba(255,255,255,0.7); font-size: 0.875rem; text-align: center; margin: 0 0 32px; word-break: break-all; }
    .otp-container { display: flex; gap: 12px; justify-content: center; margin-bottom: 28px; }
    .otp-box { width: 52px; height: 58px; text-align: center; font-size: 1.5rem; font-weight: 700; color: #FFFFFF; background: #162245; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; outline: none; transition: all 0.2s ease; font-family: inherit; }
    .otp-box:focus { border-color: #00E676; box-shadow: 0 0 0 3px rgba(0,230,118,0.15); background: #1A2A50; }
    .otp-box.filled { border-color: rgba(255,255,255,0.2); background: #1A2A50; }
    .btn-primary { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px 24px; background: linear-gradient(135deg, #00E676 0%, #00C853 100%); color: #0A1428; font-weight: 700; font-size: 1rem; border: none; border-radius: 10px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 16px rgba(0,230,118,0.3); margin-bottom: 16px; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,230,118,0.4); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .spinner { width: 18px; height: 18px; border: 2px solid rgba(10,20,40,0.3); border-top-color: #0A1428; border-radius: 50%; animation: spin 0.6s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .resend-row { text-align: center; margin-bottom: 16px; }
    .resend-timer { color: rgba(255,255,255,0.5); font-size: 0.8rem; }
    .resend-btn { background: none; border: none; color: #00E676; font-size: 0.875rem; font-weight: 600; cursor: pointer; padding: 0; font-family: inherit; }
    .resend-btn:hover { text-decoration: underline; }
    .resend-btn:disabled { opacity: 0.5; cursor: not-allowed; text-decoration: none; }
    .error-msg { color: #FF5252; font-size: 0.8rem; text-align: center; margin-bottom: 16px; padding: 8px 12px; background: rgba(255,82,82,0.1); border-radius: 8px; }

    @media (max-width: 480px) {
      .auth-card { padding: 24px 20px; border-radius: 12px; }
      .logo-bet, .logo-pool { font-size: 1.6rem; }
      .auth-title { font-size: 1.25rem; }
      .otp-box { width: 44px; height: 50px; font-size: 1.25rem; }
      .otp-container { gap: 8px; }
    }
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

  onFocus(event: FocusEvent) {
    (event.target as HTMLInputElement).select();
  }

  verifyOtp() {
    const code = this.otpDigits.join('');
    if (code.length < 6) return;
    this.loading.set(true);
    this.error.set(null);

    if (this.purpose() === 'login') {
      this.auth.verifyLoginOtp(this.phone(), code)
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
          error: (err) => this.error.set(err.error?.message || 'Invalid OTP')
        });
    } else {
      this.auth.verifySignupOtp(this.phone(), code)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => this.router.navigate(['/auth/setup-pin'], { state: { phone: this.phone(), fullName: this.fullName(), email: this.email(), code } }),
          error: (err) => this.error.set(err.error?.message || 'Invalid OTP')
        });
    }
  }

  resendOtp() {
    this.loading.set(true);
    this.error.set(null);
    this.auth.resendOtp(this.phone(), this.purpose())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: any) => { this.otpDigits = ['', '', '', '', '', '']; this.startResendTimer(); },
        error: (err) => this.error.set(err.error?.message || 'Failed to resend OTP')
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
