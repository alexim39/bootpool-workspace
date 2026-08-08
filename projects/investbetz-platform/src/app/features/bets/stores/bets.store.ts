import { Injectable, signal, computed, inject, effect, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { StakeService, Stake, WalletService, AuthService, BetSummary } from '../../../core/services';

export type HistoryStatus = 'all' | 'settled' | Stake['status'];

@Injectable({ providedIn: 'root' })
export class BetsStore implements OnDestroy {
  readonly stakeService = inject(StakeService);
  readonly auth = inject(AuthService);
  private _wallet = inject(WalletService);

  loading = signal(false);
  loadingHistory = signal(false);
  totalStakes = signal(0);
  totalPages = signal(1);
  cashingOutStake = signal<Stake | null>(null);

  readonly activeStakes = this.stakeService.activeStakes;
  readonly activeCount = computed(() => this.activeStakes().length);
  readonly walletBalance = computed(() => this._wallet.balance().available || 0);

  wonCount = signal(0);
  lostCount = signal(0);
  voidCount = signal(0);
  settledStakes = signal<Stake[]>([]);

  readonly betSummary = signal<BetSummary | null>(null);
  readonly summaryLoading = signal(false);

  searchQuery = signal('');
  statusFilter = signal<HistoryStatus>('settled');
  sortField = signal<'createdAt' | 'stakeAmount' | 'payout'>('createdAt');
  sortOrder = signal<'desc' | 'asc'>('desc');
  dateFrom = signal<string | null>(null);
  dateTo = signal<string | null>(null);
  page = signal(1);
  pageSize = signal(20);

  readonly hasActiveFilters = computed(() =>
    this.searchQuery().trim().length > 0 ||
    this.statusFilter() !== 'settled' ||
    this.sortField() !== 'createdAt' ||
    this.sortOrder() !== 'desc' ||
    !!this.dateFrom() ||
    !!this.dateTo()
  );

  readonly rangeLabel = computed(() => {
    const total = this.totalStakes();
    if (!total) return 'No records';
    const start = (this.page() - 1) * this.pageSize() + 1;
    const end = Math.min(this.page() * this.pageSize(), total);
    return `${start}–${end} of ${total}`;
  });

  private search$ = new Subject<string>();
  private searchSub: Subscription;

  constructor() {
    this.searchSub = this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => this.fetchHistory(1));
    effect(() => this.loadCounts());
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
  }

  init() {
    this.stakeService.fetchActiveStakes();
    this.fetchHistory(1);
    this.fetchSummary();
    this._wallet.fetchBalance();
  }

  fetchSummary() {
    this.summaryLoading.set(true);
    this.stakeService.fetchBetSummary().subscribe({
      next: (res) => {
        if (res.success) this.betSummary.set(res.data);
        this.summaryLoading.set(false);
      },
      error: () => this.summaryLoading.set(false)
    });
  }

  private loadCounts() {
    const stakes = this.settledStakes();
    this.wonCount.set(stakes.filter(s => s.status === 'won').length);
    this.lostCount.set(stakes.filter(s => s.status === 'lost' || s.status === 'refunded').length);
    this.voidCount.set(stakes.filter(s => s.status === 'void' || s.status === 'cancelled').length);
  }

  fetchHistory(page: number, append = false) {
    this.loadingHistory.set(true);
    this.stakeService.fetchMyStakes({
      page,
      limit: this.pageSize(),
      status: this.statusFilter(),
      search: this.searchQuery().trim() || undefined,
      sortField: this.sortField(),
      sortOrder: this.sortOrder(),
      from: this.dateFrom() || undefined,
      to: this.dateTo() || undefined
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.settledStakes.set(append ? [...this.settledStakes(), ...res.data.stakes] : res.data.stakes);
          this.totalStakes.set(res.data.total);
          this.totalPages.set(res.data.totalPages ?? 1);
          this.page.set(page);
        }
        this.loadingHistory.set(false);
      },
      error: () => this.loadingHistory.set(false)
    });
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    this.search$.next(value);
  }

  setStatusFilter(status: HistoryStatus) {
    this.statusFilter.set(status);
    this.fetchHistory(1);
  }

  setSort(value: string) {
    const [field, order] = value.split('-') as ['createdAt' | 'stakeAmount' | 'payout', string];
    this.sortField.set(field ?? 'createdAt');
    this.sortOrder.set(order === 'asc' ? 'asc' : 'desc');
    this.fetchHistory(1);
  }

  setDateFrom(value: string | null) {
    this.dateFrom.set(value || null);
    this.fetchHistory(1);
  }

  setDateTo(value: string | null) {
    this.dateTo.set(value || null);
    this.fetchHistory(1);
  }

  resetFilters() {
    this.searchQuery.set('');
    this.search$.next('');
    this.statusFilter.set('settled');
    this.sortField.set('createdAt');
    this.sortOrder.set('desc');
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.fetchHistory(1);
  }

  onPageChange(pageIndex: number) {
    this.fetchHistory(pageIndex + 1);
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.fetchHistory(1);
  }

  loadMoreHistory() {
    if (this.page() < this.totalPages() && !this.loadingHistory()) {
      this.fetchHistory(this.page() + 1, true);
    }
  }

  requestCashout(stakeId: string) {
    const stake = this.activeStakes().find(s => s.id === stakeId);
    if (stake && !stake.isParlay) {
      this.cashingOutStake.set(stake);
    }
  }

  dismissCashout() {
    this.cashingOutStake.set(null);
  }

  onCashoutComplete() {
    this.dismissCashout();
    this._wallet.fetchBalance();
    this.stakeService.fetchActiveStakes();
    this.fetchHistory(1);
    this.fetchSummary();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDay(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatStatus(status: Stake['status']): string {
    if (status === 'cashed_out') return 'Cashed Out';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatResultLabel(stake: Stake): string {
    if (stake.status === 'won') return 'Won';
    if (stake.status === 'cashed_out') return 'Cashed Out';
    if (stake.status === 'lost') return this.hasRefund(stake) ? 'Refunded' : 'Lost';
    if (stake.status === 'void') return 'Voided';
    if (stake.status === 'refunded') return 'Refunded';
    if (stake.status === 'cancelled') return 'Cancelled';
    return stake.status.charAt(0).toUpperCase() + stake.status.slice(1);
  }

  hasRefund(stake: Stake): boolean {
    return !stake.isParlay && (stake.refundAmount || 0) > 0;
  }

  refundAmount(stake: Stake): number {
    return stake.refundAmount || 0;
  }
}
