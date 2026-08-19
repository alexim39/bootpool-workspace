import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { CashoutModalComponent } from '../../../home/components/cashout-modal/cashout-modal.component';
import { BetsWinLossChartComponent } from '../../components/bets-win-loss-chart/bets-win-loss-chart.component';
import { AutoCashoutComponent } from '../../components/auto-cashout/auto-cashout.component';
import { MobileNavComponent } from '../../../../core/components';
import { BetsStore, HistoryStatus } from '../../stores/bets.store';
import { kickoffCountdown } from '../../../games/game-status.util';

@Component({
  selector: 'app-bets-mobile',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatChipsModule, MatSelectModule,
    CashoutModalComponent, BetsWinLossChartComponent, MobileNavComponent, AutoCashoutComponent
  ],
  templateUrl: './bets-mobile.component.html',
  styleUrls: ['./bets-mobile.component.scss']
})
export class BetsMobileComponent implements OnInit {
  readonly store = inject(BetsStore);

  activeTab = signal<'active' | 'history'>('active');

  statusOptions: { value: HistoryStatus; label: string }[] = [
    { value: 'settled', label: 'Settled' },
    { value: 'all', label: 'All' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
    { value: 'cashed_out', label: 'Cashed out' }
  ];

  sortOptions: { value: string; label: string }[] = [
    { value: 'createdAt-desc', label: 'Newest first' },
    { value: 'createdAt-asc', label: 'Oldest first' },
    { value: 'stakeAmount-desc', label: 'Highest stake' },
    { value: 'stakeAmount-asc', label: 'Lowest stake' },
    { value: 'payout-desc', label: 'Highest payout' },
    { value: 'payout-asc', label: 'Lowest payout' }
  ];

  ngOnInit() {
    this.store.init();
  }

  setStatus(value: HistoryStatus) {
    this.store.setStatusFilter(value);
  }

  setSort(value: string) {
    this.store.setSort(value);
  }

  onSearchInput(event: Event) {
    this.store.onSearchInput((event.target as HTMLInputElement).value);
  }

  onDateFrom(event: Event) {
    this.store.setDateFrom((event.target as HTMLInputElement).value || null);
  }

  onDateTo(event: Event) {
    this.store.setDateTo((event.target as HTMLInputElement).value || null);
  }

  loadMore() {
    this.store.loadMoreHistory();
  }

  matchTime(matchDate: string | undefined | null): string {
    if (!matchDate) return '';
    return new Date(matchDate).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  }

  matchDay(matchDate: string | undefined | null): string {
    if (!matchDate) return '';
    const d = new Date(matchDate);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    const day = d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    if (d.toDateString() === today.toDateString()) return `Today · ${day}`;
    if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow · ${day}`;
    return day;
  }

  matchCountdown(matchDate: string | undefined | null): string {
    if (!matchDate) return '';
    return kickoffCountdown(matchDate);
  }

  isUpcomingMatchDate(matchDate: string | undefined | null): boolean {
    return !!matchDate && new Date(matchDate).getTime() > Date.now();
  }
}
