import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  readonly store = inject(AuthStore);
  private router = inject(Router);

  phone = '';
  pin = '';
  email = '';
  emailToken = '';

  sendOtp() {
    const phone = this.phone.trim();
    if (phone.length < 10) return;
    this.store.sendOtp(phone, () => this.router.navigate(['/auth/verify-otp'], { state: { phone, purpose: 'login' } }));
  }

  loginWithPin() {
    const phone = this.phone.trim();
    const pin = this.pin.trim();
    if (phone.length < 10 || pin.length < 4) return;
    this.store.loginWithPin(phone, pin, () => this.router.navigate(['/home']));
  }

  sendEmailToken() {
    const email = this.email.trim();
    if (!email) return;
    this.store.sendEmailToken(email, () => this.store.emailTokenSent.set(true));
  }

  verifyEmailToken() {
    const email = this.email.trim();
    const code = this.emailToken.trim();
    if (code.length < 6) return;
    this.store.verifyEmailToken(email, code, () => this.router.navigate(['/home']));
  }

  resetEmailToken() {
    this.emailToken = '';
    this.store.resetEmailToken();
  }
}
