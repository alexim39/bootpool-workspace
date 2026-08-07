import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BetManagerStore } from '../../stores/bet-manager.store';
import { BET_MANAGER_TIERS } from '../../bet-manager.tier-config';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppNavComponent } from '../../../../core/components';

@Component({
  selector: 'app-bet-manager-overview',
  standalone: true,
  imports: [DecimalPipe, MatButtonModule, MatIconModule, MatTooltipModule, AppNavComponent],
  templateUrl: './bet-manager-overview.component.html',
  styleUrls: ['./bet-manager-overview.component.scss'],
})
export class BetManagerOverviewComponent implements OnInit {
  readonly store = inject(BetManagerStore);
  readonly showGuide = signal(false);
  private router = inject(Router);

  readonly tiers = BET_MANAGER_TIERS;

  ngOnInit() {
    this.store.fetchAccounts();
  }

  getAccount(tier: string) {
    return this.store.accounts().find(a => a.tier === tier);
  }

  get totals() {
    const accounts = this.store.accounts();
    return {
      aum: accounts.reduce((sum, a) => sum + a.currentValue, 0),
      deposited: accounts.reduce((sum, a) => sum + a.totalDeposited, 0),
      profit: accounts.reduce((sum, a) => sum + a.totalProfit, 0),
    };
  }

  growthPct(account: { currentValue: number; totalDeposited: number } | undefined): number {
    if (!account || account.totalDeposited <= 0) return 0;
    return Math.max(0, Math.min(100, (account.currentValue / account.totalDeposited) * 100));
  }

  goDeposit(tier: string) {
    this.router.navigate(['/bet-manager/deposit', tier]);
  }

  goDetail(tier: string) {
    this.router.navigate(['/bet-manager', tier]);
  }

  withdraw(tier: string) {
    this.store.withdraw(tier, () => this.store.fetchAccounts());
  }
}
