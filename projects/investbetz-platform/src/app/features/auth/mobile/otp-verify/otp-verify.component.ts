import { Component, inject, DestroyRef } from '@angular/core';
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

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras.state as { phone?: string; fullName?: string; email?: string; purpose?: 'login' | 'signup' } | null;
    this.store.init({
      phone: state?.phone,
      fullName: state?.fullName,
      email: state?.email,
      purpose: state?.purpose
    });
    if (!this.store.phone() && history.state?.phone) {
      this.store.phone.set(history.state.phone);
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
    this.store.verifyOtp(
      code,
      () => this.router.navigate(['/home']),
      (code) => this.router.navigate(['/auth/setup-pin'], { state: { phone: this.store.phone(), fullName: this.store.fullName(), email: this.store.email(), code } })
    );
  }

  resendOtp() {
    this.store.resendOtp(() => {
      this.otpDigits = ['', '', '', '', '', ''];
      this.startResendTimer();
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
