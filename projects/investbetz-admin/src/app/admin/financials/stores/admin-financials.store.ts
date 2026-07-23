import { Injectable, inject, signal } from '@angular/core';
import { AdminService, AdminWithdrawal, AdminTransaction, DashboardStats } from '../../services';

@Injectable({ providedIn: 'root' })
export class AdminFinancialsStore {
  private admin = inject(AdminService);

  readonly activeTab = signal<'overview' | 'withdrawals' | 'transactions'>('overview');

  readonly dashData = signal<DashboardStats & { totalPayouts?: number; totalPods?: number; pendingSettlements?: number }>({
    totalUsers: 0, activePods: 0, totalStakes: 0, totalVolume: 0,
    totalPayouts: 0, pendingSettlements: 0, totalPods: 0,
    dailyVolume: [], recentStakes: [], podStatusBreakdown: []
  });
  readonly loading = signal(false);

  readonly totals = signal({ deposits: 0, withdrawals: 0, pendingCount: 0, pendingAmount: 0, revenue: 0 });

  readonly withdrawals = signal<AdminWithdrawal[]>([]);
  readonly wdLoading = signal(false);
  readonly wdPage = signal(1);
  readonly wdLimit = signal(20);
  readonly wdTotal = signal(0);
  readonly wdTotalPages = signal(0);
  readonly wdFilter = signal<{ status: string }>({ status: '' });
  readonly selectedWd = signal<AdminWithdrawal | null>(null);
  readonly wdActionLoading = signal(false);
  readonly showRejectForm = signal(false);
  readonly rejectReason = signal('');

  readonly transactions = signal<AdminTransaction[]>([]);
  readonly txLoading = signal(false);
  readonly txPage = signal(1);
  readonly txLimit = signal(20);
  readonly txTotal = signal(0);
  readonly txTotalPages = signal(0);
  readonly txFilter = signal<{ type: string; status: string }>({ type: '', status: '' });
  readonly selectedTx = signal<AdminTransaction | null>(null);

  readonly recentItems = signal<AdminTransaction[]>([]);

  readonly showAdjustModal = signal(false);
  readonly adjustLoading = signal(false);
  readonly adjustData = signal<{ userId: string; amount: number; type: 'credit' | 'debit'; reason: string }>({ userId: '', amount: 0, type: 'credit', reason: '' });
  readonly adjustResult = signal<{ success: boolean; message: string } | null>(null);

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
    this.admin.getTransactions({ page: 1, limit: 1, type: 'deposit', status: 'completed' }).subscribe();
    this.admin.getTransactions({ page: 1, limit: 1, type: 'withdrawal', status: 'completed' }).subscribe();
  }

  loadRecent() {
    this.admin.getTransactions({ page: 1, limit: 10 }).subscribe(res => {
      if (res.success) this.recentItems.set(res.data.items);
    });
  }

  loadWithdrawals() {
    this.wdLoading.set(true);
    this.selectedWd.set(null);
    this.showRejectForm.set(false);
    this.admin.getWithdrawals({ page: this.wdPage(), limit: this.wdLimit(), status: this.wdFilter().status || undefined })
      .subscribe(res => {
        if (res.success) {
          this.withdrawals.set(res.data.items);
          this.wdTotal.set(res.data.total);
          this.wdPage.set(res.data.page);
          this.wdTotalPages.set(res.data.totalPages);
          this.calcTotals();
        }
        this.wdLoading.set(false);
      });
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

  loadTransactions() {
    this.txLoading.set(true);
    this.selectedTx.set(null);
    this.admin.getTransactions({
      page: this.txPage(), limit: this.txLimit(),
      type: this.txFilter().type || undefined,
      status: this.txFilter().status || undefined
    }).subscribe(res => {
      if (res.success) {
        this.transactions.set(res.data.items);
        this.txTotal.set(res.data.total);
        this.txPage.set(res.data.page);
        this.txTotalPages.set(res.data.totalPages);
      }
      this.txLoading.set(false);
    });
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

  setRejectReason(reason: string) {
    this.rejectReason.set(reason);
  }

  cancelReject() {
    this.showRejectForm.set(false);
    this.rejectReason.set('');
  }

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

  prevWdPage() { this.wdPage.update(p => p - 1); this.loadWithdrawals(); }
  nextWdPage() { this.wdPage.update(p => p + 1); this.loadWithdrawals(); }
  setWdFilterStatus(s: string) { this.wdFilter.set({ status: s }); this.wdPage.set(1); this.loadWithdrawals(); }

  prevTxPage() { this.txPage.update(p => p - 1); this.loadTransactions(); }
  nextTxPage() { this.txPage.update(p => p + 1); this.loadTransactions(); }
  setTxFilterType(t: string) { this.txFilter.update(f => ({ ...f, type: t })); this.txPage.set(1); this.loadTransactions(); }
  setTxFilterStatus(s: string) { this.txFilter.update(f => ({ ...f, status: s })); this.txPage.set(1); this.loadTransactions(); }
}
