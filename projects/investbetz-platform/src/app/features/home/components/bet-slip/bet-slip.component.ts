import { Component, inject, signal, computed, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HomeStore } from '../../stores/home.store';
import { Pod } from '../../../../core/services';
import { WalletService } from '../../../../core/services';

export interface BetSlipSelection {
  pod: Pod;
}

@Component({
  selector: 'app-bet-slip',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule
  ],
  templateUrl: './bet-slip.component.html',
  styleUrls: ['./bet-slip.component.scss']
})
export class BetSlipComponent {
  private wallet = inject(WalletService);
  private snackBar = inject(MatSnackBar);
  readonly store = inject(HomeStore);

  selections = input<Pod[]>([]);
  open = input(false);
  placeBetResult = input<{ success: boolean; message?: string } | null>(null);
  remove = output<string>();
  clearAllSelections = output<void>();
  closePanel = output<void>();
  togglePanel = output<void>();
  placeBetRequest = output<{ podIds: string[]; stakeAmount: number; idempotencyKey: string }>();

  submitting = signal(false);
  bookingCodeInput = signal('');

  /**
   * Idempotency key for the current slip — created on first submit, kept across
   * retries of the SAME slip so the server dedupes, rotated when the slip empties.
   */
  private slipKey: string | null = null;
  /** Synchronous re-entrancy guard: blocks double-taps within the same tick, before CD disables the button. */
  private emitGuard = false;

  private keyWatcher = effect(() => {
    if (this.selections().length === 0) {
      this.slipKey = null;
      this.emitGuard = false;
    }
  });

  private resultWatcher = effect(() => {
    if (this.placeBetResult()) {
      this.submitting.set(false);
      // Release the tap guard so a genuine failure can be retried
      // (same slipKey → server dedupes; success clears selections → key rotates).
      this.emitGuard = false;
    }
  });

  stakeError = signal<string | null>(null);

  availableBalance = computed(() => this.wallet.balance().available || 0);

  combinedMultiplier = computed(() => {
    return this.selections().reduce((acc, p) => acc * p.gainsMultiplier, 1);
  });

  insuranceActive = computed(() => {
    return this.selections().length >= this.store.insuranceMinLegs();
  });

  potentialPayout = computed(() => {
    return Math.floor(this.store.slipStakeAmount() * this.combinedMultiplier());
  });

  platformFee = computed(() => {
    const feePercent = 10;
    return Math.floor(this.potentialPayout() * (feePercent / 100));
  });

  netPayout = computed(() => this.potentialPayout() - this.platformFee());

  quickAmounts = computed(() => {
    const balance = this.availableBalance();
    return [100, 200, 500, 1000, 2000, 5000].filter(a => a <= balance);
  });

  canPlace = computed(() => {
    return this.selections().length >= 2
      && this.store.slipStakeAmount() >= 100
      && this.store.slipStakeAmount() <= 5000
      && !this.stakeError()
      && !this.submitting();
  });

  setAmount(amount: number) {
    this.store.setSlipStakeAmount(amount);
    this.validateStake();
  }

  validateStake() {
    const amt = this.store.slipStakeAmount();
    if (amt < 100) {
      this.stakeError.set('Minimum accumulator stake is ₦100');
    } else if (amt > 5000) {
      this.stakeError.set('Maximum accumulator stake is ₦5,000');
    } else if (amt > this.availableBalance()) {
      this.stakeError.set('Insufficient balance');
    } else {
      this.stakeError.set(null);
    }
  }

  clearAll() {
    this.store.setSlipStakeAmount(0);
    this.stakeError.set(null);
    this.submitting.set(false);
    this.slipKey = null;
    this.emitGuard = false;
  }

  placeBet() {
    if (!this.canPlace() || this.emitGuard) return;
    this.emitGuard = true;

    const podIds = this.selections().map(s => s.id);
    if (!this.slipKey) {
      try {
        this.slipKey = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      } catch {
        this.slipKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }
    }
    this.submitting.set(true);
    this.placeBetRequest.emit({ podIds, stakeAmount: this.store.slipStakeAmount(), idempotencyKey: this.slipKey });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount || 0);
  }

  applyBookingCode() {
    const code = this.bookingCodeInput().trim();
    if (!code || this.store.redeemLoading()) return;
    this.store.redeemBookingCode(code).subscribe({
      next: (ok) => {
        if (ok) {
          this.bookingCodeInput.set('');
          this.snackBar.open('Booking code applied', 'OK', { duration: 2500 });
        }
      }
    });
  }

  shareBookingCode() {
    if (this.store.bookingCode()) return;
    this.store.createBookingCode(this.selections().map(s => s.id));
  }

  clearBookingCode() {
    this.store.clearBookingCode();
  }

  async copyBookingCode() {
    const code = this.store.bookingCode();
    if (!code) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      this.snackBar.open('Booking code copied', 'OK', { duration: 2500 });
    } catch {
      this.snackBar.open(`Copy failed — code: ${code}`, 'OK', { duration: 6000 });
    }
  }

  formatExpiry(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
