import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { Stake } from '../../../../core/services';
import { BetCardComponent } from '../../components/bet-card/bet-card.component';
import { CashoutModalComponent } from '../../../home/components/cashout-modal/cashout-modal.component';
import { AppNavComponent } from '../../../../core/components';
import { BetsStore, HistoryStatus } from '../../stores/bets.store';

@Component({
  selector: 'app-bets-desktop',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTabsModule, MatTableModule, MatPaginatorModule, MatSelectModule,
    MatProgressSpinnerModule, MatBadgeModule, MatChipsModule,
    BetCardComponent, CashoutModalComponent, AppNavComponent
  ],
  templateUrl: './bets-desktop.component.html',
  styleUrls: ['./bets-desktop.component.scss']
})
export class BetsDesktopComponent implements OnInit {
  readonly store = inject(BetsStore);

  displayedColumns = ['date', 'match', 'odds', 'stake', 'payout', 'status', 'result'];

  statusOptions: { value: HistoryStatus; label: string }[] = [
    { value: 'settled', label: 'Settled' },
    { value: 'all', label: 'All bets' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
    { value: 'cashed_out', label: 'Cashed out' },
    { value: 'void', label: 'Voided' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  sortOptions: { value: string; label: string }[] = [
    { value: 'createdAt-desc', label: 'Newest first' },
    { value: 'createdAt-asc', label: 'Oldest first' },
    { value: 'stakeAmount-desc', label: 'Highest stake' },
    { value: 'stakeAmount-asc', label: 'Lowest stake' },
    { value: 'payout-desc', label: 'Highest payout' },
    { value: 'payout-asc', label: 'Lowest payout' }
  ];

  pageSizeOptions = [10, 20, 50];

  ngOnInit() {
    this.store.init();
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

  onPageSizeChange(size: number) {
    this.store.onPageSizeChange(size);
  }

  onPageEvent(event: PageEvent) {
    if (event.pageSize !== this.store.pageSize()) {
      this.onPageSizeChange(event.pageSize);
    } else {
      this.store.onPageChange(event.pageIndex);
    }
  }

  getStatusClass(status: Stake['status']): string {
    const classes: Record<Stake['status'], string> = {
      pending: 'chip-gold', confirmed: 'chip-gold', won: 'chip-emerald',
      lost: 'chip-gray', void: 'chip-gray', refunded: 'chip-gray', cancelled: 'chip-gray', cashed_out: 'chip-blue'
    };
    return classes[status] || 'chip-gray';
  }

  getStatusIcon(status: Stake['status']): string {
    const icons: Record<Stake['status'], string> = {
      pending: 'schedule', confirmed: 'check_circle', won: 'emoji_events',
      lost: 'autorenew', void: 'remove_circle', refunded: 'autorenew', cancelled: 'block', cashed_out: 'currency_exchange'
    };
    return icons[status] || 'help';
  }
}
