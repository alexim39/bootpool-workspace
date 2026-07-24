import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { BetManagerStore } from '../../stores/bet-manager.store';

@Component({
  selector: 'app-bet-manager-detail',
  standalone: true,
  imports: [DecimalPipe, DatePipe, MatButtonModule, MatIconModule, MatTooltipModule, FormsModule],
  templateUrl: './bet-manager-detail.component.html',
  styleUrls: ['./bet-manager-detail.component.scss'],
})
export class BetManagerDetailComponent implements OnInit {
  readonly store = inject(BetManagerStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  tier = '';
  showConfirmWithdraw = signal(false);
  depositPage = signal(1);
  historyPage = signal(1);

  readonly tierConfig: Record<string, { label: string; icon: string; minDeposit: number; color: string; strategy: string }> = {
    defender: { label: 'Defender', icon: '🛡️', minDeposit: 50_000, color: '#00E676', strategy: 'Conservative — low-risk Pods, high refund confidence' },
    midfielder: { label: 'Midfielder', icon: '⚡', minDeposit: 100_000, color: '#E8B923', strategy: 'Balanced — mix of Pods and Match Pools' },
    striker: { label: 'Striker', icon: '🎯', minDeposit: 200_000, color: '#FF5252', strategy: 'Aggressive — higher multipliers, more Match Pools' },
  };

  ngOnInit() {
    this.tier = this.route.snapshot.paramMap.get('tier') || '';
    if (!this.tierConfig[this.tier]) {
      this.router.navigate(['/bet-manager']);
      return;
    }
    this.store.fetchAccount(this.tier);
    this.store.fetchNav(this.tier);
    this.store.fetchPerformance(this.tier);
    this.store.fetchDepositHistory(this.tier, 1);
  }

  get config() { return this.tierConfig[this.tier]!; }

  goBack() { this.router.navigate(['/bet-manager']); }
  goDeposit() { this.router.navigate(['/bet-manager/deposit', this.tier]); }

  withdraw() {
    this.showConfirmWithdraw.set(false);
    this.store.withdraw(this.tier, () => {
      this.store.fetchAccount(this.tier);
      this.store.fetchPerformance(this.tier);
    });
  }

  loadHistoryPage(page: number) {
    this.historyPage.set(page);
    this.store.fetchDepositHistory(this.tier, page);
  }
}
