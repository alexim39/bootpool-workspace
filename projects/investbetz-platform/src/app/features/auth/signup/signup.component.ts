import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  readonly store = inject(AuthStore);
  private router = inject(Router);

  phone = '';
  fullName = '';
  email = '';
  termsAccepted = false;

  get isFormValid(): boolean {
    return this.fullName.trim().length >= 2 && this.phone.trim().length >= 10 && this.termsAccepted;
  }

  toggleTerms() {
    this.termsAccepted = !this.termsAccepted;
  }

  createAccount() {
    if (!this.isFormValid) return;
    this.store.requestSignupOtp(this.phone.trim(), this.email.trim() || undefined, () =>
      this.router.navigate(['/auth/verify-otp'], { state: { phone: this.phone.trim(), fullName: this.fullName.trim(), email: this.email.trim(), purpose: 'signup' } })
    );
  }
}
