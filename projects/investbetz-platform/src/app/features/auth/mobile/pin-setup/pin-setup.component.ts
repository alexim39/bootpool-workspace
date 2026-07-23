import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../stores/auth.store';

@Component({
  selector: 'app-mobile-pin-setup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './pin-setup.component.html',
  styleUrls: ['./pin-setup.component.scss']
})
export class PinSetupComponent {
  readonly store = inject(AuthStore);
  private router = inject(Router);

  pin = '';
  confirmPin = '';

  get canSubmit(): boolean {
    return this.pin.length === 4 && this.confirmPin.length === 4 && this.pin === this.confirmPin;
  }

  get pinMismatch(): boolean {
    return this.confirmPin.length === 4 && this.pin !== this.confirmPin;
  }

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras.state as { phone?: string; fullName?: string; email?: string; code?: string } | null;
    this.store.init({
      phone: state?.phone,
      fullName: state?.fullName,
      email: state?.email,
      code: state?.code
    });
    if (!this.store.phone() && history.state?.phone) {
      this.store.phone.set(history.state.phone);
    }
  }

  goBack() { this.router.navigate(['/auth/verify-otp']); }

  submitPin() {
    if (!this.canSubmit) return;
    this.store.completeSignup({
      phone: this.store.phone(),
      fullName: this.store.fullName(),
      pin: this.pin.trim(),
      email: this.store.email() || undefined,
      code: this.store.code()
    }, () => this.router.navigate(['/home']));
  }
}
