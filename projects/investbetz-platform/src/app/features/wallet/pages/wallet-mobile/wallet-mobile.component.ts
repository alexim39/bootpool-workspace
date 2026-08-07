import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TopUpModalComponent, MobileNavComponent } from '../../../../core/components';
import { WalletStore, WALLET_PAGE_SIZES } from '../../stores/wallet.store';

@Component({
  selector: 'app-wallet-mobile',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatBadgeModule,
    TopUpModalComponent, MobileNavComponent
  ],
  templateUrl: './wallet-mobile.component.html',
  styleUrls: ['./wallet-mobile.component.scss']
})
export class WalletMobileComponent implements OnInit, OnDestroy {
  readonly store = inject(WalletStore);
  readonly pageSizes = WALLET_PAGE_SIZES;

  readonly TYPE_CHIPS = ['all', 'deposit', 'withdrawal', 'stake', 'payout', 'refund', 'bonus', 'fee'] as const;
  readonly STATUS_CHIPS = ['all', 'completed', 'pending', 'processing', 'failed', 'cancelled'] as const;
  readonly SORT_CHIPS = [
    { field: 'createdAt', order: 'desc', label: 'Newest' },
    { field: 'createdAt', order: 'asc', label: 'Oldest' },
    { field: 'amount', order: 'desc', label: 'Amount ↑' },
    { field: 'amount', order: 'asc', label: 'Amount ↓' }
  ] as const;

  readonly displayTopUp = signal(false);
  readonly searchInput = signal('');
  private readonly search$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  ngOnInit() {
    this.store.init();
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => this.store.setHistoryFilters({ search: value }));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(value: string) {
    this.searchInput.set(value);
    this.search$.next(value);
  }

  clearSearch() {
    this.searchInput.set('');
    this.store.setHistoryFilters({ search: '' });
  }

  setType(type: string) {
    this.store.setHistoryFilters({ type: type === 'all' ? '' : type });
  }

  setStatus(status: string) {
    this.store.setHistoryFilters({ status: status === 'all' ? '' : status });
  }

  setSort(field: 'createdAt' | 'amount', order: 'asc' | 'desc') {
    this.store.setHistoryFilters({ sortField: field, sortOrder: order });
  }

  isSortOn(field: 'createdAt' | 'amount', order: 'asc' | 'desc'): boolean {
    return this.store.historySortField() === field && this.store.historySortOrder() === order;
  }

  setFrom(value: string) {
    this.store.setHistoryFilters({ from: value || undefined });
  }

  setTo(value: string) {
    this.store.setHistoryFilters({ to: value || undefined });
  }

  setPageSize(size: number) {
    this.store.setHistoryPageSize(size);
  }

  clearFilters() {
    this.store.clearHistoryFilters();
    this.searchInput.set('');
  }
}
