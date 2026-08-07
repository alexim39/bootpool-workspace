import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../core/services';
import { AppNavComponent, TopUpModalComponent } from '../../../../core/components';
import { WalletStore, WALLET_PAGE_SIZES } from '../../stores/wallet.store';

const TYPE_CHIPS: { key: string; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'deposit', label: 'Deposits' },
  { key: 'withdrawal', label: 'Withdrawals' },
  { key: 'stake', label: 'Stakes' },
  { key: 'payout', label: 'Payouts' },
  { key: 'refund', label: 'Refunds' },
  { key: 'bonus', label: 'Bonuses' },
  { key: 'fee', label: 'Fees' }
];

const STATUS_CHIPS: { key: string; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'failed', label: 'Failed' },
  { key: 'cancelled', label: 'Cancelled' }
];

@Component({
  selector: 'app-wallet-desktop',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    AppNavComponent,
    TopUpModalComponent
  ],
  templateUrl: './wallet-desktop.component.html',
  styleUrls: ['./wallet-desktop.component.scss']
})
export class WalletDesktopComponent implements OnInit, OnDestroy {
  readonly store = inject(WalletStore);
  _auth = inject(AuthService);

  readonly typeChips = TYPE_CHIPS;
  readonly statusChips = STATUS_CHIPS;
  readonly pageSizes = WALLET_PAGE_SIZES;

  displayTopUp = signal(false);
  searchInput = signal('');

  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.store.init();
    this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.store.setHistoryFilters({ search: term }));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(term: string) {
    this.searchInput.set(term);
    this.search$.next(term);
  }

  clearSearch() {
    this.searchInput.set('');
    this.search$.next('');
  }

  setType(key: string) { this.store.setHistoryFilters({ type: key }); }
  setStatus(key: string) { this.store.setHistoryFilters({ status: key }); }
  setSort(field: 'createdAt' | 'amount', order: 'asc' | 'desc') { this.store.setHistoryFilters({ sortField: field, sortOrder: order }); }
  setFrom(value: string) { this.store.setHistoryFilters({ from: value }); }
  setTo(value: string) { this.store.setHistoryFilters({ to: value }); }
  setPageSize(size: number) { this.store.setHistoryPageSize(size); }

  loadPage(page: number) { this.store.loadHistoryPage(page); }

  get rangeStart(): number {
    const total = this.store.totalTransactions();
    if (total === 0) return 0;
    return (this.store.historyPage() - 1) * this.store.historyLimit() + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.store.historyPage() * this.store.historyLimit(), this.store.totalTransactions());
  }

  openDeposit() { this.displayTopUp.set(true); }
}
