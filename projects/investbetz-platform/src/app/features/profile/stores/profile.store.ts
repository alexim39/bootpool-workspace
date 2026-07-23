import { Injectable, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService, WalletService, StakeService } from '../../../core/services';

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private _auth = inject(AuthService);
  private _wallet = inject(WalletService);
  private _stake = inject(StakeService);
  private _fb = inject(FormBuilder);

  readonly user = computed(() => this._auth.user());
  readonly walletBalance = computed(() => this._wallet.balance().available || 0);
  readonly activeBetsCount = computed(() => this._stake.activeStakes().length);

  readonly savingProfile = signal(false);
  readonly changingPin = signal(false);
  readonly showPinChange = signal(false);
  readonly showOraChat = signal(false);
  readonly showFaq = signal(false);
  readonly kycType = signal<'bvn' | 'nin'>('bvn');
  readonly submittingKyc = signal(false);
  readonly referralStats = signal<{ totalReferrals: number; referralBonus: number; referrals: Array<{ fullName: string; createdAt: string }> } | null>(null);
  readonly showPhoneOtp = signal(false);
  readonly verifyingPhone = signal(false);
  readonly activeTab = signal<string>('');

  readonly kycNumberCtrl = new FormControl('', [Validators.required, Validators.pattern(/^\d{11}$/)]);
  readonly phoneOtpCode = new FormControl('', [Validators.required, Validators.pattern(/^\d{6}$/)]);

  readonly profileForm: FormGroup;
  readonly pinForm: FormGroup;

  constructor() {
    this.profileForm = this._fb.group({
      fullName: [this.user()?.fullName || '', Validators.required],
      email: [this.user()?.email || '', [Validators.email]]
    });

    this.pinForm = this._fb.group({
      currentPin: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPin: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      confirmPin: ['', Validators.required]
    }, { validators: this.pinMatchValidator });
  }

  private pinMatchValidator(form: FormGroup) {
    const newPin = form.get('newPin')?.value;
    const confirmPin = form.get('confirmPin')?.value;
    return newPin && confirmPin && newPin !== confirmPin ? { pinMismatch: true } : null;
  }

  init() {
    this._wallet.fetchBalance();
    this._stake.fetchActiveStakes();
    this._auth.getReferralStats().subscribe({
      next: (res) => {
        if (res.success) this.referralStats.set(res.data);
      }
    });
  }

  updateProfile(afterSubmit: (message: string) => void) {
    if (this.profileForm.invalid || this.profileForm.pristine) return;
    this.savingProfile.set(true);
    this._auth.updateProfile(this.profileForm.value).subscribe({
      next: (res) => {
        this.savingProfile.set(false);
        if (res.success && res.data) {
          this._auth.user.set(res.data);
          localStorage.setItem('ib_user', JSON.stringify(res.data));
          afterSubmit('Profile updated');
        } else {
          afterSubmit(res.message || 'Failed to update profile');
        }
      },
      error: (err) => {
        this.savingProfile.set(false);
        afterSubmit(err.error?.message || 'Failed to update profile');
      }
    });
  }

  changePin(afterSubmit: (message: string) => void) {
    if (this.pinForm.invalid) return;
    this.changingPin.set(true);
    const { currentPin, newPin } = this.pinForm.value;
    this._auth.changePin(currentPin, newPin).subscribe({
      next: (res) => {
        this.changingPin.set(false);
        if (res.success) {
          afterSubmit('PIN changed successfully');
          this.showPinChange.set(false);
          this.pinForm.reset();
        } else {
          afterSubmit(res.message || 'Failed to change PIN');
        }
      },
      error: () => {
        this.changingPin.set(false);
        afterSubmit('Failed to change PIN');
      }
    });
  }

  requestPhoneVerification(afterSubmit: (message: string) => void) {
    if (!this.user()?.phone) return;
    this._auth.requestPhoneVerification(this.user()!.phone).subscribe({
      next: (res) => {
        if (res.success) {
          this.showPhoneOtp.set(true);
          afterSubmit('Verification code sent via SMS');
        }
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to send code';
        if (msg === 'Phone already verified') {
          const current = this._auth.user();
          if (current) {
            this._auth.user.set({ ...current, phoneVerified: true });
            localStorage.setItem('ib_user', JSON.stringify({ ...current, phoneVerified: true }));
          }
        }
        afterSubmit(msg);
      }
    });
  }

  confirmPhoneVerification(afterSubmit: (message: string) => void) {
    if (this.phoneOtpCode.invalid || !this.user()?.phone) return;
    this.verifyingPhone.set(true);
    this._auth.confirmPhoneVerification(this.user()!.phone, this.phoneOtpCode.value!).subscribe({
      next: (res) => {
        this.verifyingPhone.set(false);
        if (res.success) {
          afterSubmit('Phone verified successfully!');
          this.showPhoneOtp.set(false);
          this.phoneOtpCode.reset();
          if (res.data?.user) {
            this._auth.user.set(res.data.user);
            localStorage.setItem('ib_user', JSON.stringify(res.data.user));
          } else {
            const current = this._auth.user();
            if (current) {
              this._auth.user.set({ ...current, phoneVerified: true });
              localStorage.setItem('ib_user', JSON.stringify({ ...current, phoneVerified: true }));
            }
          }
        } else {
          afterSubmit(res.message || 'Verification failed');
        }
      },
      error: () => {
        this.verifyingPhone.set(false);
        afterSubmit('Verification failed');
      }
    });
  }

  submitKyc(afterSubmit: (message: string) => void) {
    if (this.kycNumberCtrl.invalid) return;
    this.submittingKyc.set(true);
    this._auth.submitKyc({ type: this.kycType(), number: this.kycNumberCtrl.value! }).subscribe({
      next: (res) => {
        this.submittingKyc.set(false);
        if (res.success) {
          afterSubmit('KYC submitted successfully!');
          this._auth.getProfile();
        } else {
          afterSubmit(res.message || 'KYC submission failed');
        }
      },
      error: () => {
        this.submittingKyc.set(false);
        afterSubmit('KYC submission failed');
      }
    });
  }

  logout() {
    this._auth.logout();
  }

  openOraChat() {
    this.showOraChat.set(true);
  }

  openFaq() {
    this.showFaq.set(true);
  }

  sendEmail() {
    window.open('mailto:support@betpool.tech');
  }

  callSupport() {
    window.open('tel:+234800INVESTBETZ');
  }

  copyReferralCode(afterSubmit: (message: string) => void) {
    const code = this.user()?.referralCode;
    if (code) {
      navigator.clipboard.writeText(code);
      afterSubmit('Referral code copied!');
    }
  }

  shareReferral() {
    const code = this.user()?.referralCode;
    const url = `${window.location.origin}/auth/signup?ref=${code}`;
    if (navigator.share) {
      navigator.share({ title: 'InvestBetz', text: `Join InvestBetz! Use my referral code: ${code}`, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  formatPhone(phone?: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('234')) {
      return '+234 ' + cleaned.slice(3, 6) + ' ' + cleaned.slice(6, 9) + ' ' + cleaned.slice(9);
    }
    return phone;
  }

  formatJoinDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });
  }
}
