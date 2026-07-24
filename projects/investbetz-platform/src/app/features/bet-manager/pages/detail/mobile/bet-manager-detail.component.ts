import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../../core/services';
import { BetManagerStore } from '../../../stores/bet-manager.store';

@Component({
  selector: 'app-mobile-bet-manager-detail',
  standalone: true,
  imports: [DecimalPipe, DatePipe, MatButtonModule, MatIconModule],
  templateUrl: './bet-manager-detail.component.html',
  styleUrls: ['./bet-manager-detail.component.scss'],
})
export class BetManagerDetailComponent implements OnInit {
  readonly store = inject(BetManagerStore);
  readonly auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  tier = '';
  showConfirmWithdraw = signal(false);
  historyPage = signal(1);

  readonly tierConfig: Record<string, { label: string; icon: string; minDeposit: number; color: string }> = {
    defender: { label: 'Defender', icon: '🛡️', minDeposit: 50_000, color: '#00E676' },
    midfielder: { label: 'Midfielder', icon: '⚡', minDeposit: 100_000, color: '#E8B923' },
    striker: { label: 'Striker', icon: '🎯', minDeposit: 200_000, color: '#FF5252' },
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
}
