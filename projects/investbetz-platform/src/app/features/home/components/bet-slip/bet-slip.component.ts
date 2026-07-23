import { Component, inject, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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

  selections = input<Pod[]>([]);
  open = input(false);
  remove = output<string>();
  clearAllSelections = output<void>();
  closePanel = output<void>();
  togglePanel = output<void>();
  placeBetRequest = output<{ podIds: string[]; stakeAmount: number }>();

  stakeAmount = signal<number>(0);
  submitting = signal(false);

  stakeError = signal<string | null>(null);

  availableBalance = computed(() => this.wallet.balance().available || 0);

  combinedMultiplier = computed(() => {
    return this.selections().reduce((acc, p) => acc * p.gainsMultiplier, 1);
  });

  potentialPayout = computed(() => {
    return Math.floor(this.stakeAmount() * this.combinedMultiplier());
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
      && this.stakeAmount() >= 100
      && this.stakeAmount() <= 5000
      && !this.stakeError()
      && !this.submitting();
  });

  setAmount(amount: number) {
    this.stakeAmount.set(amount);
    this.validateStake();
  }

  validateStake() {
    const amt = this.stakeAmount();
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
    this.stakeAmount.set(0);
    this.stakeError.set(null);
    this.submitting.set(false);
  }

  placeBet() {
    if (!this.canPlace()) return;

    const podIds = this.selections().map(s => s.id);
    this.submitting.set(true);
    this.placeBetRequest.emit({ podIds, stakeAmount: this.stakeAmount() });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount || 0);
  }
}
