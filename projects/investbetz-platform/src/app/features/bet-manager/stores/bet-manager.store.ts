import { Injectable, inject, signal, computed } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { BetManagerService, BetManagerAccount, BetManagerSummary, NavData, PerformanceData, DepositRecord, HistoryQuery } from '../services/bet-manager.service';

export interface HistoryFilterPatch {
  type?: string;
  status?: string;
  from?: string;
  to?: string;
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class BetManagerStore {
  private _api = inject(BetManagerService);

  loading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  accounts = signal<BetManagerAccount[]>([]);
  selectedTier = signal<string | null>(null);
  summary = signal<BetManagerSummary | null>(null);
  navData = signal<NavData | null>(null);
  performance = signal<PerformanceData | null>(null);
  depositHistory = signal<DepositRecord[]>([]);
  historyTotal = signal(0);
  historyLoading = signal(false);
  historyPage = signal(1);
  historyLimit = signal(10);
  historyType = signal('');
  historyStatus = signal('');
  historyFrom = signal('');
  historyTo = signal('');
  historySearch = signal('');
  historySortField = signal('depositedAt');
  historySortOrder = signal<'asc' | 'desc'>('desc');

  historyTotalPages = computed(() => Math.max(1, Math.ceil(this.historyTotal() / this.historyLimit())));
  activeFilterCount = computed(() => {
    let n = 0;
    if (this.historyType()) n++;
    if (this.historyStatus()) n++;
    if (this.historyFrom()) n++;
    if (this.historyTo()) n++;
    if (this.historySearch()) n++;
    if (this.historySortField() !== 'depositedAt' || this.historySortOrder() !== 'desc') n++;
    return n;
  });
  hasActiveFilters = computed(() => this.activeFilterCount() > 0);

  fetchAccounts() {
    this.loading.set(true);
    this.error.set(null);
    this._api.getAccounts().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res) => { if (res.success) this.accounts.set(res.data); },
      error: (err) => this.error.set(err.error?.message || 'Failed to load accounts'),
    });
  }

  fetchAccount(tier: string) {
    this.loading.set(true);
    this.error.set(null);
    this.selectedTier.set(tier);
    this._api.getAccount(tier).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res) => {
        if (res.success) {
          this.summary.set(res.data);
          if (!res.data) {
            this.navData.set(null);
            this.performance.set(null);
            this.depositHistory.set([]);
            this.historyTotal.set(0);
          }
        }
      },
      error: (err) => this.error.set(err.error?.message || 'Failed to load account'),
    });
  }

  fetchNav(tier: string) {
    this._api.getNav(tier).subscribe({
      next: (res) => { if (res.success) this.navData.set(res.data); },
    });
  }

  fetchPerformance(tier: string) {
    this._api.getPerformance(tier).subscribe({
      next: (res) => { if (res.success) this.performance.set(res.data); },
    });
  }

  fetchDepositHistory() {
    const tier = this.selectedTier();
    if (!tier) return;
    this.historyLoading.set(true);
    const query: HistoryQuery = {
      page: this.historyPage(),
      limit: this.historyLimit(),
      sortField: this.historySortField(),
      sortOrder: this.historySortOrder(),
    };
    if (this.historyType()) query.type = this.historyType();
    if (this.historyStatus()) query.status = this.historyStatus();
    if (this.historyFrom()) query.from = this.historyFrom();
    if (this.historyTo()) query.to = this.historyTo();
    if (this.historySearch()) query.search = this.historySearch();
    this._api.getDepositHistory(tier, query).subscribe({
      next: (res) => {
        if (res.success) {
          this.depositHistory.set(res.data.deposits);
          this.historyTotal.set(res.data.total);
        }
      },
      error: () => {
        this.depositHistory.set([]);
        this.historyTotal.set(0);
      },
      complete: () => this.historyLoading.set(false),
    });
  }

  setHistoryFilters(patch: HistoryFilterPatch) {
    if (patch.type !== undefined) this.historyType.set(patch.type);
    if (patch.status !== undefined) this.historyStatus.set(patch.status);
    if (patch.from !== undefined) this.historyFrom.set(patch.from);
    if (patch.to !== undefined) this.historyTo.set(patch.to);
    if (patch.search !== undefined) this.historySearch.set(patch.search);
    if (patch.sortField !== undefined) this.historySortField.set(patch.sortField);
    if (patch.sortOrder !== undefined) this.historySortOrder.set(patch.sortOrder);
    this.historyPage.set(1);
    this.fetchDepositHistory();
  }

  clearHistoryFilters() {
    this.historyType.set('');
    this.historyStatus.set('');
    this.historyFrom.set('');
    this.historyTo.set('');
    this.historySearch.set('');
    this.historySortField.set('depositedAt');
    this.historySortOrder.set('desc');
    this.historyPage.set(1);
    this.fetchDepositHistory();
  }

  loadHistoryPage(page: number) {
    const clamped = Math.max(1, Math.min(page, this.historyTotalPages()));
    if (clamped === this.historyPage()) return;
    this.historyPage.set(clamped);
    this.fetchDepositHistory();
  }

  setHistoryPageSize(size: number) {
    if (size === this.historyLimit()) return;
    this.historyLimit.set(size);
    this.historyPage.set(1);
    this.fetchDepositHistory();
  }

  deposit(tier: string, amount: number, onSuccess: () => void) {
    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);
    this._api.deposit(tier, amount).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage.set(res.message);
          this.fetchAccounts();
          onSuccess();
        } else {
          this.error.set(res.message || 'Deposit failed');
        }
      },
      error: (err) => this.error.set(err.error?.message || 'Deposit failed'),
    });
  }

  withdraw(tier: string, onSuccess: () => void) {
    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);
    this._api.withdraw(tier).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage.set(res.message);
          this.fetchAccounts();
          onSuccess();
        } else {
          this.error.set(res.message || 'Withdrawal failed');
        }
      },
      error: (err) => this.error.set(err.error?.message || 'Withdrawal failed'),
    });
  }

  clearMessages() {
    this.error.set(null);
    this.successMessage.set(null);
  }
}
