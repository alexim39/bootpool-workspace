import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BetManagerStore } from '../../stores/bet-manager.store';
import { DecimalPipe } from '@angular/common';
import { AppNavComponent } from '../../../../core/components';

@Component({
  selector: 'app-bet-manager-deposit',
  standalone: true,
  imports: [FormsModule, DecimalPipe, AppNavComponent],
  templateUrl: './bet-manager-deposit.component.html',
  styleUrls: ['./bet-manager-deposit.component.scss'],
})
export class BetManagerDepositComponent implements OnInit {
  readonly store = inject(BetManagerStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  tier = '';
  amount = 0;
  customAmount = 0;
  useCustom = false;
  amountOptions: number[] = [];

  readonly tierConfig: Record<string, { label: string; icon: string; minDeposit: number; color: string }> = {
    defender: { label: 'Defender', icon: '🛡️', minDeposit: 50_000, color: '#00E676' },
    midfielder: { label: 'Midfielder', icon: '⚡', minDeposit: 100_000, color: '#E8B923' },
    striker: { label: 'Striker', icon: '🎯', minDeposit: 200_000, color: '#FF5252' },
  };

  ngOnInit() {
    this.tier = this.route.snapshot.paramMap.get('tier') || '';
    if (!this.tierConfig[this.tier]) {
      this.router.navigate(['/bet-manager']);
    }
    this.amount = this.tierConfig[this.tier]!.minDeposit;
    this.amountOptions = [this.amount, this.amount * 2, this.amount * 5];
  }

  get config() {
    return this.tierConfig[this.tier]!;
  }

  selectAmount(val: number) {
    this.useCustom = false;
    this.amount = val;
  }

  useCustomAmount() {
    this.useCustom = true;
    this.customAmount = 0;
    this.amount = 0;
  }

  get validAmount(): number {
    if (this.useCustom) return this.customAmount;
    return this.amount;
  }

  get canSubmit(): boolean {
    const amt = this.validAmount;
    return amt >= (this.config?.minDeposit || 0) && !this.store.loading();
  }

  submit() {
    if (!this.canSubmit) return;
    this.store.deposit(this.tier, this.validAmount, () => {
      setTimeout(() => this.router.navigate(['/bet-manager']), 1500);
    });
  }

  goBack() {
    this.router.navigate(['/bet-manager']);
  }
}
