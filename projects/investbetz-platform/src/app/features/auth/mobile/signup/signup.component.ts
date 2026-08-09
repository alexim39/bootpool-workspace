import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthStore } from '../../stores/auth.store';

@Component({
  selector: 'app-mobile-signup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  readonly store = inject(AuthStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  phone = '';
  fullName = '';
  email = '';
  referralCode = '';
  termsAccepted = false;

  constructor() {
    const ref = this.route.snapshot.queryParamMap.get('ref');
    if (ref && /^[A-Z0-9]{6}$/i.test(ref)) {
      this.referralCode = ref.toUpperCase();
    }
  }

  get isFormValid(): boolean {
    return this.fullName.trim().length >= 2 && this.phone.trim().length >= 10 && this.isValidEmail(this.email) && this.termsAccepted;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  }

  goBack() { this.router.navigate(['/auth/login']); }

  goLogin() { this.router.navigate(['/auth/login']); }

  toggleTerms() { this.termsAccepted = !this.termsAccepted; }

  createAccount() {
    if (!this.isFormValid) return;
    this.store.requestSignupOtp(this.phone.trim(), this.email.trim(), () =>
      this.router.navigate(['/auth/verify-otp'], {
        state: {
          phone: this.phone.trim(),
          fullName: this.fullName.trim(),
          email: this.email.trim(),
          referralCode: this.referralCode.trim().toUpperCase() || undefined,
          purpose: 'signup'
        }
      })
    );
  }
}
