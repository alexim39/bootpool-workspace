import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { WalletService, Transaction, Bank, WithdrawalLimits, StakeService, AuthService, WalletHistoryQuery } from '../../../core/services';

export interface WalletHistoryFilters {
  type?: string;
  status?: string;
  search?: string;
  from?: string;
  to?: string;
  sortField?: 'createdAt' | 'amount' | 'type' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const WALLET_PAGE_SIZES = [25, 50, 100];

@Injectable({ providedIn: 'root' })
export class WalletStore {
  readonly walletService = inject(WalletService);
  readonly auth = inject(AuthService);
  private _stake = inject(StakeService);
  private _router = inject(Router);

  transactions = signal<Transaction[]>([]);
  banks = signal<Bank[]>([]);
  withdrawalLimits = signal<WithdrawalLimits>({ min: 500, max: 5000000, dailyLimit: 10000000, fee: 'No fees' });
  loading = signal(false);
  loadingMore = signal(false);
  error = signal<string | null>(null);
  totalTransactions = signal(0);

  // ---- server-side history filter state ----
  historyType = signal<string>('');
  historyStatus = signal<string>('');
  historyFrom = signal<string>('');
  historyTo = signal<string>('');
  historySearch = signal<string>('');
  historySortField = signal<'createdAt' | 'amount' | 'type' | 'status'>('createdAt');
  historySortOrder = signal<'asc' | 'desc'>('desc');
  historyPage = signal(1);
  historyLimit = signal(25);

  readonly walletBalance = computed(() => this.walletService.balance());
  readonly totalDeposited = computed(() => this.walletService.balance().totalDeposited || 0);
  readonly totalWithdrawn = computed(() => this.walletService.balance().totalWithdrawn || 0);
  readonly totalStaked = computed(() => this.walletService.balance().totalStaked || 0);
  readonly totalWon = computed(() => this.walletService.balance().totalWon || 0);
  readonly hasMore = computed(() => this.transactions().length < this.totalTransactions());

  readonly historyTotalPages = computed(() => Math.max(1, Math.ceil(this.totalTransactions() / this.historyLimit())));
  readonly activeFilterCount = computed(() => {
    let n = 0;
    if (this.historyType()) n++;
    if (this.historyStatus()) n++;
    if (this.historyFrom() || this.historyTo()) n++;
    if (this.historySearch()) n++;
    if (this.historySortField() !== 'createdAt' || this.historySortOrder() !== 'desc') n++;
    if (this.historyLimit() !== 25) n++;
    return n;
  });
  readonly hasActiveFilters = computed(() => this.activeFilterCount() > 0);

  readonly currentPage = computed(() => this.historyPage());

  init() {
    this.fetchBalance();
    this.fetchBanks();
    this.fetchTransactions();
    this.recoverPendingDeposits();
    this.fetchWithdrawalLimits();
    this._stake.fetchActiveStakes();
  }

  recoverPendingDeposits() {
    this.walletService.recoverPendingDeposits();
  }

  fetchBalance() {
    this.walletService.fetchBalance();
  }

  fetchBanks() {
    this.walletService.fetchBanks();
  }

  fetchWithdrawalLimits() {
    this.walletService.fetchWithdrawalLimits();
  }

  private buildQuery(): WalletHistoryQuery {
    return {
      type: this.historyType() || undefined,
      status: this.historyStatus() || undefined,
      search: this.historySearch() || undefined,
      from: this.historyFrom() || undefined,
      to: this.historyTo() || undefined,
      sortField: this.historySortField(),
      sortOrder: this.historySortOrder()
    };
  }

  fetchTransactions(page = 1, limit?: number) {
    const effLimit = limit ?? this.historyLimit();
    this.loading.set(true);
    this.error.set(null);
    this.walletService.fetchTransactions(page, effLimit, this.buildQuery()).subscribe({
      next: (res) => {
        if (res.success) {
          this.transactions.set(res.data.transactions);
          this.totalTransactions.set(res.data.total);
          this.historyPage.set(res.data.page || page);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to fetch transactions');
        this.loading.set(false);
      }
    });
  }

  setHistoryFilters(patch: WalletHistoryFilters) {
    if (patch.type !== undefined) this.historyType.set(patch.type);
    if (patch.status !== undefined) this.historyStatus.set(patch.status);
    if (patch.search !== undefined) this.historySearch.set(patch.search);
    if (patch.from !== undefined) this.historyFrom.set(patch.from);
    if (patch.to !== undefined) this.historyTo.set(patch.to);
    if (patch.sortField !== undefined) this.historySortField.set(patch.sortField);
    if (patch.sortOrder !== undefined) this.historySortOrder.set(patch.sortOrder);
    if (patch.limit !== undefined) this.historyLimit.set(patch.limit);
    this.fetchTransactions(1, patch.limit ?? undefined);
  }

  clearHistoryFilters() {
    this.historyType.set('');
    this.historyStatus.set('');
    this.historyFrom.set('');
    this.historyTo.set('');
    this.historySearch.set('');
    this.historySortField.set('createdAt');
    this.historySortOrder.set('desc');
    this.historyLimit.set(25);
    this.fetchTransactions(1, 25);
  }

  loadHistoryPage(page: number) {
    const clamped = Math.max(1, Math.min(page, this.historyTotalPages()));
    if (clamped === this.historyPage() && !this.loading()) return;
    this.fetchTransactions(clamped);
  }

  setHistoryPageSize(size: number) {
    if (!WALLET_PAGE_SIZES.includes(size)) return;
    this.setHistoryFilters({ limit: size, page: 1 });
  }

  loadMore() {
    if (!this.hasMore() || this.loading() || this.loadingMore()) return;
    this.loadingMore.set(true);
    this.walletService.fetchTransactions(this.historyPage() + 1, this.historyLimit(), this.buildQuery()).subscribe({
      next: (res) => {
        if (res.success) {
          this.transactions.update(t => [...t, ...res.data.transactions]);
          this.totalTransactions.set(res.data.total);
          this.historyPage.set(res.data.page);
        }
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false)
    });
  }

  refresh() {
    this.fetchBalance();
    this.fetchTransactions(this.historyPage());
  }

  openDeposit(displayTopUp: ReturnType<typeof signal<boolean>>) {
    displayTopUp.set(true);
  }

  openWithdraw() {
    this._router.navigate(['/wallet/withdraw']);
  }

  openTransfer() {
    this._router.navigate(['/wallet/transfer']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount || 0);
  }

  formatDay(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  }

  formatDateFull(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatType(type: string): string {
    if (type === 'deposit') return 'Deposit';
    if (type === 'withdrawal') return 'Withdrawal';
    if (type === 'stake') return 'Stake';
    if (type === 'winnings') return 'Winnings';
    if (type === 'refund') return 'Refund';
    if (type === 'cashout') return 'Cashout';
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      deposit: 'primary', withdrawal: 'warn', stake: 'accent', payout: 'primary',
      refund: 'primary', bonus: 'accent', fee: 'warn', winnings: 'primary',
      cashout: 'primary'
    };
    return colors[type] || 'primary';
  }

  isCredit(type: string): boolean {
    return ['deposit', 'payout', 'refund', 'bonus', 'winnings', 'cashout'].includes(type);
  }

  isDebit(type: string): boolean {
    return ['withdrawal', 'stake', 'fee'].includes(type);
  }

  getTransactionIcon(type: string): string {
    const icons: Record<string, string> = {
      deposit: 'account_balance_wallet', withdrawal: 'money_off', stake: 'casino',
      payout: 'emoji_events', refund: 'undo', bonus: 'card_giftcard', fee: 'receipt_long',
      winnings: 'emoji_events', cashout: 'currency_exchange'
    };
    return icons[type] || 'help';
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'chip-accent', processing: 'chip-primary', completed: 'chip-emerald',
      failed: 'chip-warn', cancelled: 'chip-warn', reversed: 'chip-accent'
    };
    return classes[status] || 'chip-warn';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: 'schedule', processing: 'autorenew', completed: 'check_circle',
      failed: 'error', cancelled: 'cancel', reversed: 'undo'
    };
    return icons[status] || 'help';
  }

  formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  txnDescription(txn: Transaction): string {
    if (txn.metadata?.['description']) return String(txn.metadata['description']);
    return txn.description || this.formatType(txn.type);
  }
}
