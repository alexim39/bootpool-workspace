import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BetManagerStore } from '../../../stores/bet-manager.store';
import { BET_MANAGER_TIERS } from '../../../bet-manager.tier-config';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MobileNavComponent } from '../../../../../core/components';
import { AuthService } from '../../../../../core/services';

@Component({
  selector: 'app-mobile-bet-manager-overview',
  standalone: true,
  imports: [DecimalPipe, MatButtonModule, MatIconModule, MatTooltipModule, RouterLink, MobileNavComponent],
  templateUrl: './bet-manager-overview.component.html',
  styleUrls: ['./bet-manager-overview.component.scss'],
})
export class BetManagerOverviewComponent implements OnInit {
  readonly store = inject(BetManagerStore);
  readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly showGuide = signal(false);

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
