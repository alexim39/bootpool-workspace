import { Component, Output, EventEmitter, inject, signal, computed, input, Input, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Pod } from '../../core/services/pod.service';
import { StakeService } from '../../core/services/stake.service';
import { WalletService } from '../../core/services/wallet.service';

@Component({
  selector: 'app-stake-modal',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatStepperModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatCheckboxModule
  ],
  templateUrl: './stake-modal.component.html',
  styleUrls: ['./stake-modal.component.scss']
})
export class StakeModalComponent implements OnInit, OnDestroy {
  pod = input.required<Pod>();
  @Input() disableClose = false;
  @Output() close = new EventEmitter<void>();
  @Output() stakePlaced = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private stakeService = inject(StakeService);
  private wallet = inject(WalletService);
  private snackBar = inject(MatSnackBar);
  private sub: any = null;

  availableBalance = computed(() => this.wallet.balance().available || 0);
  submitting = signal(false);
  currentStepIndex = signal(0);

  amountForm: FormGroup = this.fb.group({
    amount: [null, [Validators.required]]
  });

  confirmForm: FormGroup = this.fb.group({
    confirmTerms: [false, Validators.requiredTrue]
  });

  /** Signal-synced amount value so computed() reacts to form changes */
  stakeAmount = signal(0);

  ngOnInit() {
    const minVal = this.pod().minStake || 100;
    const maxVal = this.pod().maxStake || 100000;
    this.amountForm.get('amount')?.addValidators([Validators.min(minVal), Validators.max(maxVal)]);
    this.amountForm.get('amount')?.updateValueAndValidity();

    this.sub = this.amountForm.get('amount')?.valueChanges
      .subscribe(val => this.stakeAmount.set(Number(val) || 0));
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  quickAmounts = computed(() => {
    const balance = this.availableBalance();
    return [5000, 10000, 20000, 50000, 100000, 500000].filter(a => a <= balance);
  });

  estimatedPayout = computed(() => {
    const amount = this.stakeAmount();
    return Math.floor(amount * (this.pod().gainsMultiplier || 0));
  });

  estimatedProfit = computed(() => {
    const amount = this.stakeAmount();
    return Math.max(0, this.estimatedPayout() - amount);
  });

  estimatedFee = computed(() => {
    const feePercent = 10;
    return Math.floor(this.estimatedPayout() * (feePercent / 100));
  });

  estimatedNetPayout = computed(() => this.estimatedPayout() - this.estimatedFee());

  setQuickAmount(amount: number) {
    this.amountForm.patchValue({ amount });
    this.amountForm.markAsTouched();
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  get minStake() { return this.pod().minStake || 5000; }
  get maxStake() { return this.pod().maxStake || 1000000; }

  amountError(): string {
    const ctrl = this.amountForm.get('amount');
    if (ctrl?.hasError('required')) return 'Enter stake amount';
    if (ctrl?.hasError('min')) return `Minimum stake is ₦${this.minStake.toLocaleString()}`;
    if (ctrl?.hasError('max')) return `Maximum stake is ₦${this.maxStake.toLocaleString()}`;
    return '';
  }

  goBack() {
    this.currentStepIndex.set(Math.max(0, this.currentStepIndex() - 1));
  }

  goForward() {
    this.currentStepIndex.set(Math.min(1, this.currentStepIndex() + 1));
  }

  placeStake() {
    if (this.amountForm.invalid || this.confirmForm.invalid) return;

    const amount = Number(this.amountForm.get('amount')?.value) || 0;
    const podId = this.pod()?.id;

    if (!podId || amount < this.minStake) {
      this.snackBar.open('Please enter a valid stake amount', 'OK', { duration: 3000 });
      return;
    }

    this.submitting.set(true);

    this.stakeService.placeStake({ podId, stakeAmount: amount }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          this.snackBar.open('Stake placed successfully!', 'OK', { duration: 3000 });
          this.stakePlaced.emit();
          this.close.emit();
        } else {
          this.snackBar.open(res.message || 'Failed to place stake', 'OK', { duration: 3000 });
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.snackBar.open(err.error?.message || 'Failed to place stake', 'OK', { duration: 3000 });
      }
    });
  }
}
