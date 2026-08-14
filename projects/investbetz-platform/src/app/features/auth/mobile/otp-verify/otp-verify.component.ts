import { Component, inject, DestroyRef, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../stores/auth.store';
import { interval, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-mobile-otp-verify',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './otp-verify.component.html',
  styleUrls: ['./otp-verify.component.scss']
})
export class OtpVerifyComponent {
  readonly store = inject(AuthStore);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  otpDigits: string[] = ['', '', '', '', '', ''];
  private timerSub: Subscription | null = null;
  private submitGate: ReturnType<typeof setTimeout> | null = null;
  private resentTimer: ReturnType<typeof setTimeout> | null = null;
  readonly shake = signal(false);
  readonly resent = signal(false);

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras.state as { phone?: string; fullName?: string; email?: string; referralCode?: string; purpose?: 'login' | 'signup' } | null;
    this.store.init({
      phone: state?.phone,
      fullName: state?.fullName,
      email: state?.email,
      referralCode: state?.referralCode,
      purpose: state?.purpose
    });
    if (!this.store.phone() && history.state?.phone) {
      this.store.phone.set(history.state.phone);
    }
    effect(() => {
      if (this.store.error()) {
        this.shake.set(true);
        setTimeout(() => this.shake.set(false), 600);
      }
    });
    this.startResendTimer();
    setTimeout(() => {
      (document.querySelector('app-mobile-otp-verify .otp-box') as HTMLInputElement | null)?.focus();
    }, 80);
  }

  get codeComplete(): boolean {
    return this.otpDigits.join('').length === 6;
  }

  get maskedPhone(): string {
    const p = this.store.phone();
    if (!p) return '';
    return `+234 •••• ${p.slice(-4)}`;
  }

  get displayEmail(): string {
    return this.store.email() || 'your inbox';
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
    if (this.codeComplete && !this.store.loading()) {
      if (this.submitGate) clearTimeout(this.submitGate);
      this.submitGate = setTimeout(() => this.verifyOtp(), 250);
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
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.verifyOtp();
    }
  }

  onFocus(event: FocusEvent) { (event.target as HTMLInputElement).select(); }

  handlePaste(event: ClipboardEvent) {
    const raw = event.clipboardData?.getData('text') || '';
    const digits = raw.replace(/\D/g, '').slice(0, 6).split('');
    if (!digits.length) return;
    event.preventDefault();
    digits.forEach((d, i) => { this.otpDigits[i] = d; });
    const inputs = (event.target as HTMLElement).parentElement?.querySelectorAll('.otp-box');
    const focusIndex = Math.min(digits.length, 5);
    (inputs?.[focusIndex] as HTMLInputElement | undefined)?.focus();
    if (this.codeComplete && !this.store.loading()) {
      setTimeout(() => this.verifyOtp(), 200);
    }
  }

  verifyOtp() {
    const code = this.otpDigits.join('');
    if (code.length < 6 || this.store.loading()) return;
    this.store.verifyOtp(
      code,
      () => this.router.navigate(['/home']),
      (code) => this.router.navigate(['/auth/setup-pin'], { state: { phone: this.store.phone(), fullName: this.store.fullName(), email: this.store.email(), referralCode: this.store.referralCode() || undefined, code } })
    );
  }

  resendOtp() {
    this.store.resendOtp(() => {
      this.otpDigits = ['', '', '', '', '', ''];
      this.startResendTimer();
      this.resent.set(true);
      if (this.resentTimer) clearTimeout(this.resentTimer);
      this.resentTimer = setTimeout(() => this.resent.set(false), 6000);
      setTimeout(() => {
        (document.querySelector('app-mobile-otp-verify .otp-box') as HTMLInputElement | null)?.focus();
      }, 60);
    });
  }

  private startResendTimer() {
    this.timerSub?.unsubscribe();
    this.store.resendCountdown.set(60);
    this.timerSub = interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.store.resendCountdown.update(v => {
          if (v <= 1) { this.timerSub?.unsubscribe(); return 0; }
          return v - 1;
        });
      });
  }
}