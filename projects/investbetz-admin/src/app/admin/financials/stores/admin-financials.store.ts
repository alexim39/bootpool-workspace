import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService, AdminWithdrawal, AdminTransaction, DashboardStats, TxStats } from '../../services';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminFinancialsStore {
  private admin = inject(AdminService);
  private destroyRef = inject(DestroyRef);

  readonly activeTab = signal<'overview' | 'withdrawals' | 'transactions'>('overview');

  readonly dashData = signal<DashboardStats & { totalPayouts?: number; totalPods?: number; pendingSettlements?: number }>({
    totalUsers: 0, activePods: 0, totalStakes: 0, totalVolume: 0,
    totalPayouts: 0, pendingSettlements: 0, totalPods: 0,
    dailyVolume: [], recentStakes: [], podStatusBreakdown: []
  });
  readonly loading = signal(false);

  readonly totals = signal({ deposits: 0, withdrawals: 0, pendingCount: 0, pendingAmount: 0, revenue: 0 });

  // Withdrawals
  readonly withdrawals = signal<AdminWithdrawal[]>([]);
  readonly wdLoading = signal(false);
  readonly wdPage = signal(1);
  readonly wdLimit = signal(25);
  readonly wdTotal = signal(0);
  readonly wdTotalPages = signal(0);
  readonly wdFilter = signal<{ status: string; search: string; dateFrom: string; dateTo: string }>({ status: '', search: '', dateFrom: '', dateTo: '' });
  readonly wdSortField = signal('createdAt');
  readonly wdSortOrder = signal<'desc' | 'asc'>('desc');
  readonly selectedWd = signal<AdminWithdrawal | null>(null);
  readonly wdActionLoading = signal(false);
  readonly showRejectForm = signal(false);
  readonly rejectReason = signal('');

  // Transactions
  readonly transactions = signal<AdminTransaction[]>([]);
  readonly txLoading = signal(false);
  readonly txPage = signal(1);
  readonly txLimit = signal(25);
  readonly txTotal = signal(0);
  readonly txTotalPages = signal(0);
  readonly txFilter = signal<{ type: string; status: string; search: string; dateFrom: string; dateTo: string }>({ type: '', status: '', search: '', dateFrom: '', dateTo: '' });
  readonly txSortField = signal('createdAt');
  readonly txSortOrder = signal<'desc' | 'asc'>('desc');
  readonly txStats = signal<TxStats | null>(null);
  readonly selectedTx = signal<AdminTransaction | null>(null);

  readonly recentItems = signal<AdminTransaction[]>([]);

  // Adjustment modal
  readonly showAdjustModal = signal(false);
  readonly adjustLoading = signal(false);
  readonly adjustData = signal<{ userId: string; amount: number; type: 'credit' | 'debit'; reason: string }>({ userId: '', amount: 0, type: 'credit', reason: '' });
  readonly adjustResult = signal<{ success: boolean; message: string } | null>(null);

  // Debounced search subjects
  private wdSearchSubject = new Subject<string>();
  private txSearchSubject = new Subject<string>();

  constructor() {
    this.wdSearchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.wdPage.set(1);
      this.loadWithdrawals();
    });

    this.txSearchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.txPage.set(1);
      this.loadTransactions();
    });
  }

  refreshAll() {
    this.loadDashboard();
    this.loadWithdrawals();
    this.loadTransactions();
    this.loadRecent();
  }

  loadDashboard() {
    this.loading.set(true);
    this.admin.getDashboard().subscribe(res => {
      if (res.success) {
        this.dashData.set(res.data);
        this.loading.set(false);
      }
    });
    this.calcTotals();
  }

  private calcTotals() {
    this.admin.getTransactions({ page: 1, limit: 1, type: 'deposit', status: 'completed' }).subscribe(res => {
      if (res.success) this.totals.update(t => ({ ...t, deposits: res.data.total }));
    });
    this.admin.getTransactions({ page: 1, limit: 1, type: 'withdrawal', status: 'completed' }).subscribe(res => {
      if (res.success) this.totals.update(t => ({ ...t, withdrawals: res.data.total }));
    });
    this.admin.getWithdrawals({ page: 1, limit: 100, status: 'pending' }).subscribe(res => {
      if (res.success) {
        this.totals.update(t => ({
          ...t,
          pendingCount: res.data.total,
          pendingAmount: res.data.items.reduce((sum: number, w: AdminWithdrawal) => sum + w.amount, 0)
        }));
      }
    });
  }

  loadRecent() {
    this.admin.getTransactions({ page: 1, limit: 10 }).subscribe(res => {
      if (res.success) this.recentItems.set(res.data.items);
    });
  }

  // === Withdrawals ===

  loadWithdrawals() {
    this.wdLoading.set(true);
    this.selectedWd.set(null);
    this.showRejectForm.set(false);
    const f = this.wdFilter();
    this.admin.getWithdrawals({
      page: this.wdPage(), limit: this.wdLimit(),
      status: f.status || undefined,
      search: f.search || undefined,
      dateFrom: f.dateFrom || undefined,
      dateTo: f.dateTo || undefined,
      sortBy: this.wdSortField(),
      sortOrder: this.wdSortOrder()
    }).subscribe(res => {
      if (res.success) {
        this.withdrawals.set(res.data.items);
        this.wdTotal.set(res.data.total);
        this.wdPage.set(res.data.page);
        this.wdTotalPages.set(res.data.totalPages);
      }
      this.wdLoading.set(false);
    });
  }

  setWdSearch(v: string) {
    this.wdFilter.update(f => ({ ...f, search: v }));
    this.wdSearchSubject.next(v);
  }

  setWdDateRange(dateFrom: string, dateTo: string) {
    this.wdFilter.update(f => ({ ...f, dateFrom, dateTo }));
    this.wdPage.set(1);
    this.loadWithdrawals();
  }

  setWdSort(field: string, order: 'desc' | 'asc') {
    this.wdSortField.set(field);
    this.wdSortOrder.set(order);
    this.loadWithdrawals();
  }

  selectWithdrawal(w: AdminWithdrawal) {
    this.selectedWd.update(prev => prev === w ? null : w);
    this.showRejectForm.set(false);
    this.rejectReason.set('');
  }

  approveWithdrawal(w: AdminWithdrawal) {
    this.wdActionLoading.set(true);
    this.admin.approveWithdrawal(w._id).subscribe(res => {
      this.wdActionLoading.set(false);
      if (res.success) {
        this.selectedWd.set(null);
        this.loadWithdrawals();
        this.loadDashboard();
        this.loadRecent();
      }
    });
  }

  rejectWithdrawal(w: AdminWithdrawal) {
    const reason = this.rejectReason();
    if (!reason.trim()) return;
    this.wdActionLoading.set(true);
    this.admin.rejectWithdrawal(w._id, reason).subscribe(res => {
      this.wdActionLoading.set(false);
      if (res.success) {
        this.selectedWd.set(null);
        this.showRejectForm.set(false);
        this.rejectReason.set('');
        this.loadWithdrawals();
      }
    });
  }

  setRejectReason(reason: string) { this.rejectReason.set(reason); }
  cancelReject() { this.showRejectForm.set(false); this.rejectReason.set(''); }

  prevWdPage() { this.wdPage.update(p => Math.max(1, p - 1)); this.loadWithdrawals(); }
  nextWdPage() { this.wdPage.update(p => p + 1); this.loadWithdrawals(); }
  setWdFilterStatus(s: string) { this.wdFilter.update(f => ({ ...f, status: s })); this.wdPage.set(1); this.loadWithdrawals(); }

  // === Transactions ===

  loadTransactions() {
    this.txLoading.set(true);
    this.selectedTx.set(null);
    const f = this.txFilter();
    this.admin.getTransactions({
      page: this.txPage(), limit: this.txLimit(),
      type: f.type || undefined,
      status: f.status || undefined,
      search: f.search || undefined,
      dateFrom: f.dateFrom || undefined,
      dateTo: f.dateTo || undefined,
      sortBy: this.txSortField(),
      sortOrder: this.txSortOrder()
    }).subscribe(res => {
      if (res.success) {
        this.transactions.set(res.data.items);
        this.txTotal.set(res.data.total);
        this.txPage.set(res.data.page);
        this.txTotalPages.set(res.data.totalPages);
        this.txStats.set((res.data as any).stats || null);
      }
      this.txLoading.set(false);
    });
  }

  setTxSearch(v: string) {
    this.txFilter.update(f => ({ ...f, search: v }));
    this.txSearchSubject.next(v);
  }

  setTxDateRange(dateFrom: string, dateTo: string) {
    this.txFilter.update(f => ({ ...f, dateFrom, dateTo }));
    this.txPage.set(1);
    this.loadTransactions();
  }

  setTxSort(field: string, order: 'desc' | 'asc') {
    this.txSortField.set(field);
    this.txSortOrder.set(order);
    this.loadTransactions();
  }

  prevTxPage() { this.txPage.update(p => Math.max(1, p - 1)); this.loadTransactions(); }
  nextTxPage() { this.txPage.update(p => p + 1); this.loadTransactions(); }
  setTxFilterType(t: string) { this.txFilter.update(f => ({ ...f, type: t })); this.txPage.set(1); this.loadTransactions(); }
  setTxFilterStatus(s: string) { this.txFilter.update(f => ({ ...f, status: s })); this.txPage.set(1); this.loadTransactions(); }

  // === Adjustment ===

  submitAdjustment() {
    const ad = this.adjustData();
    if (!ad.userId || !ad.amount || !ad.reason) return;
    this.adjustLoading.set(true);
    this.adjustResult.set(null);
    this.admin.adjustWallet(ad.userId, ad.amount, ad.type, ad.reason).subscribe({
      next: (res: any) => {
        this.adjustResult.set({ success: true, message: res.message || 'Adjustment successful' });
        this.adjustLoading.set(false);
        setTimeout(() => { this.showAdjustModal.set(false); this.adjustResult.set(null); this.refreshAll(); }, 1500);
      },
      error: (err) => {
        this.adjustResult.set({ success: false, message: err.error?.message || 'Adjustment failed' });
        this.adjustLoading.set(false);
      }
    });
  }

  setAdjustUserId(v: string) { this.adjustData.update(d => ({ ...d, userId: v })); }
  setAdjustAmount(v: number) { this.adjustData.update(d => ({ ...d, amount: v })); }
  setAdjustType(v: 'credit' | 'debit') { this.adjustData.update(d => ({ ...d, type: v })); }
  setAdjustReason(v: string) { this.adjustData.update(d => ({ ...d, reason: v })); }
}
