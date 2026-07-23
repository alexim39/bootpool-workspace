import { Component, Input, Output, EventEmitter, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WalletService } from '../../services';

@Component({
  selector: 'app-top-up-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './top-up-modal.component.html',
  styleUrls: ['./top-up-modal.component.scss']
})
export class TopUpModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) visible!: boolean;
  @Input() disableClose = true;
  @Output() close = new EventEmitter<void>();

  private wallet = inject(WalletService);

  readonly MIN_DEPOSIT = 5000;
  readonly MAX_DEPOSIT = 1_000_000;

  quickAmounts = [5000, 10000, 20000, 50000, 100000, 500000];
  selectedAmount = signal<number | null>(null);
  processing = signal(false);
  error = signal<string | null>(null);

  amountControl = new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(this.MIN_DEPOSIT),
    Validators.max(this.MAX_DEPOSIT)
  ]);

  amountValue = signal(0);
  isValidAmount = computed(() => {
    const val = this.amountValue();
    return val >= this.MIN_DEPOSIT && val <= this.MAX_DEPOSIT;
  });

  currentBalance = computed(() => this.wallet.balance().available || 0);
  newBalanceAfter = computed(() => this.currentBalance() + this.amountValue());

  private sub: any = null;

  ngOnInit() {
    this.sub = this.amountControl.valueChanges
      .subscribe(val => this.amountValue.set(Number(val) || 0));
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  selectAmount(amount: number) {
    this.selectedAmount.set(amount);
    this.amountControl.setValue(amount);
    this.amountControl.markAsDirty();
    this.error.set(null);
  }

  onAmountInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const num = Number(value) || 0;
    this.selectedAmount.set(this.quickAmounts.includes(num) ? num : null);
    this.error.set(null);
  }

  onOverlayClick() {
    if (!this.disableClose) {
      this.close.emit();
    }
  }

  initiatePayment() {
    if (!this.isValidAmount() || this.processing()) return;
    this.processing.set(true);
    this.error.set(null);

    const amount = this.amountValue();

    this.wallet.initiateDeposit(amount, 'paystack').subscribe({
      next: (res) => {
        this.processing.set(false);
        if (res.success && res.authorizationUrl) {
          window.location.href = res.authorizationUrl;
        } else {
          this.error.set(res.message || 'Failed to initiate payment');
        }
      },
      error: (err) => {
        this.processing.set(false);
        this.error.set(err.error?.message || 'Payment initiation failed');
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
