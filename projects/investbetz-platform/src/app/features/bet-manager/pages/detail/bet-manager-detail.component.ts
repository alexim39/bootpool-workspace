import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { AppNavComponent } from '../../../../core/components';
import { TierProgressChartComponent } from '../../components/tier-progress-chart/tier-progress-chart.component';
import { BetManagerStore } from '../../stores/bet-manager.store';
import { betManagerTierInfo } from '../../bet-manager.tier-config';

@Component({
  selector: 'app-bet-manager-detail',
  standalone: true,
  imports: [DecimalPipe, DatePipe, MatButtonModule, MatIconModule, MatTooltipModule, FormsModule, AppNavComponent, TierProgressChartComponent],
  templateUrl: './bet-manager-detail.component.html',
  styleUrls: ['./bet-manager-detail.component.scss'],
})
export class BetManagerDetailComponent implements OnInit {
  readonly store = inject(BetManagerStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  tier = '';
  showConfirmWithdraw = signal(false);
  searchTerm = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly pageSizeOptions = [10, 20, 50];

  ngOnInit() {
    this.tier = this.route.snapshot.paramMap.get('tier') || '';
    if (!betManagerTierInfo(this.tier)) {
      this.router.navigate(['/bet-manager']);
      return;
    }
    this.store.fetchAccount(this.tier);
    this.store.fetchNav(this.tier);
    this.store.fetchPerformance(this.tier);
    this.store.fetchDepositHistory();
  }

  get config() { return betManagerTierInfo(this.tier); }

  goBack() { this.router.navigate(['/bet-manager']); }
  goDeposit() { this.router.navigate(['/bet-manager/deposit', this.tier]); }

  withdraw() {
    this.showConfirmWithdraw.set(false);
    this.store.withdraw(this.tier, () => {
      this.store.fetchAccount(this.tier);
      this.store.fetchPerformance(this.tier);
      this.store.fetchDepositHistory();
    });
  }

  onSearchInput() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.store.setHistoryFilters({ search: this.searchTerm });
    }, 350);
  }

  setType(type: string) { this.store.setHistoryFilters({ type }); }
  setStatus(status: string) { this.store.setHistoryFilters({ status }); }
  setSort(sortField: string, sortOrder: 'asc' | 'desc') { this.store.setHistoryFilters({ sortField, sortOrder }); }
  setPageSize(size: number) { this.store.setHistoryPageSize(size); }
  clearFilters() { this.searchTerm = ''; this.store.clearHistoryFilters(); }

  unlockDate(rec: { withdrawableAt: string | null; status: string }): string | null {
    if (rec.status !== 'locked' || !rec.withdrawableAt) return null;
    const d = new Date(rec.withdrawableAt);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString();
  }

  get rangeStart(): number {
    return ((this.store.historyPage() - 1) * this.store.historyLimit()) + 1;
  }

  get rangeEnd(): number {
    const end = this.store.historyPage() * this.store.historyLimit();
    return end > this.store.historyTotal() ? this.store.historyTotal() : end;
  }
}
