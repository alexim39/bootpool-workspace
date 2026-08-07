import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BetManagerStore } from '../../../stores/bet-manager.store';
import { betManagerTierInfo } from '../../../bet-manager.tier-config';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MobileNavComponent } from '../../../../../core/components';
import { AuthService } from '../../../../../core/services';

@Component({
  selector: 'app-mobile-bet-manager-deposit',
  standalone: true,
  imports: [FormsModule, DecimalPipe, MatButtonModule, MatIconModule, MobileNavComponent],
  templateUrl: './bet-manager-deposit.component.html',
  styleUrls: ['./bet-manager-deposit.component.scss'],
})
export class BetManagerDepositComponent implements OnInit {
  readonly store = inject(BetManagerStore);
  readonly auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  tier = '';
  amount = 0;
  customAmount = 0;
  useCustom = false;
  amountOptions: number[] = [];

  ngOnInit() {
    this.tier = this.route.snapshot.paramMap.get('tier') || '';
    if (!betManagerTierInfo(this.tier)) {
      this.router.navigate(['/bet-manager']);
      return;
    }
    this.amount = this.config.minDeposit;
    this.amountOptions = [this.amount, this.amount * 2, this.amount * 5];
    this.store.fetchNav(this.tier);
  }

  get config() { return betManagerTierInfo(this.tier); }

  selectAmount(val: number) { this.useCustom = false; this.amount = val; }
  useCustomAmount() { this.useCustom = true; this.customAmount = 0; this.amount = 0; }
  get validAmount(): number { return this.useCustom ? this.customAmount : this.amount; }
  get estimatedUnits(): number | null {
    const nav = this.store.navData()?.current?.nav;
    if (!nav || nav <= 0) return null;
    return this.validAmount / nav;
  }
  get canSubmit(): boolean { const a = this.validAmount; return a >= (this.config?.minDeposit || 0) && !this.store.loading(); }

  submit() {
    if (!this.canSubmit) return;
    this.store.deposit(this.tier, this.validAmount, () => {
      setTimeout(() => this.router.navigate(['/bet-manager']), 1500);
    });
  }

  goBack() { this.router.navigate(['/bet-manager']); }
}
