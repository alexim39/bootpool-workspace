import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StakeService, Stake } from '../../../../core/services';

@Component({
  selector: 'app-cashout-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './cashout-modal.component.html',
  styleUrls: ['./cashout-modal.component.scss']
})
export class CashoutModalComponent {
  @Input({ required: true }) stake!: Stake;
  @Output() close = new EventEmitter<void>();
  @Output() cashoutConfirmed = new EventEmitter<void>();

  private stakeService = inject(StakeService);
  private snackBar = inject(MatSnackBar);

  submitting = signal(false);

  cashoutFee = () => Math.floor(this.stake.stakeAmount * 0.1);
  cashoutPayout = () => this.stake.stakeAmount - this.cashoutFee();

  confirmCashout() {
    this.submitting.set(true);

    this.stakeService.confirmCashout(this.stake.id).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          this.snackBar.open(`Cashed out! You received ${this.formatCurrency(this.cashoutPayout())}`, 'OK', { duration: 4000 });
          this.cashoutConfirmed.emit();
          this.close.emit();
        } else {
          this.snackBar.open(res.message || 'Cashout failed', 'OK', { duration: 3000 });
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.snackBar.open(err.error?.message || 'Cashout failed', 'OK', { duration: 3000 });
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }
}
