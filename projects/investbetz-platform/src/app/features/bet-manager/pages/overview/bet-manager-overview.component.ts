import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BetManagerStore } from '../../stores/bet-manager.store';
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

  readonly tiers = [
    {
      key: 'defender',
      label: 'Defender',
      icon: '🛡️',
      minDeposit: 50_000,
      strategy: 'Conservative — low-risk Pods, high refund confidence',
      allocation: 'Mostly Pods, 1.2x–1.8x multiplier',
      color: '#00E676',
    },
    {
      key: 'midfielder',
      label: 'Midfielder',
      icon: '⚡',
      minDeposit: 100_000,
      strategy: 'Balanced — mix of Pods and Match Pools',
      allocation: 'Mix of Pods (1.5x–2.5x) and Match Pools',
      color: '#E8B923',
    },
    {
      key: 'striker',
      label: 'Striker',
      icon: '🎯',
      minDeposit: 200_000,
      strategy: 'Aggressive — higher multipliers, more Match Pools',
      allocation: 'Higher-multiplier Pods (2x–5x), more Match Pools',
      color: '#FF5252',
    },
  ];

  ngOnInit() {
    this.store.fetchAccounts();
  }

  getAccount(tier: string) {
    return this.store.accounts().find(a => a.tier === tier);
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
