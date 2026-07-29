import { Injectable, inject, signal } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AdminService, AdminWithdrawal } from '../../services';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class AdminWithdrawMgtStore {
  private admin = inject(AdminService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  readonly withdrawals = signal<AdminWithdrawal[]>([]);
  readonly loading = signal(false);
  readonly actionLoading = signal<string | null>(null);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly statusFilter = signal('');
  readonly searchQuery = signal('');
  readonly detail = signal<AdminWithdrawal | null>(null);
  readonly detailId = signal<string | null>(null);
  readonly showReject = signal(false);
  readonly rejectReason = signal('');
  readonly confirmAction = signal<{ type: string; w: AdminWithdrawal } | null>(null);

  readonly columns = ['user', 'amount', 'account', 'bank', 'status', 'date', 'actions'];

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  private search$ = new Subject<string>();

  destroy() { this.destroy$.next(); this.destroy$.complete(); }

  load() {
    this.loading.set(true);
    this.admin.getWithdrawals({ page: this.page(), limit: this.limit(), status: this.statusFilter() || undefined }).subscribe(res => {
      if (res.success) {
        this.withdrawals.set(res.data.items);
        this.total.set(res.data.total);
        this.page.set(res.data.page);
        this.totalPages.set(res.data.totalPages);
      }
      this.loading.set(false);
    });
  }

  onSearchInput() { this.search$.next(this.searchQuery()); }

  onFilterChange() { this.page.set(1); this.load(); }

  goTo(p: number) { if (p < 1 || p > this.totalPages()) return; this.page.set(p); this.load(); }

  visiblePages(): number[] {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 7) { const r: number[] = []; for (let i = 1; i <= total; i++) r.push(i); return r; }
    const range: number[] = [1];
    const delta = 2;
    if (current - delta > 2) range.push(-1);
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) range.push(i);
    if (current + delta < total - 1) range.push(-2);
    range.push(total);
    return range;
  }

  toggleDetail(w: AdminWithdrawal) {
    if (this.detailId() === w._id) { this.detail.set(null); this.detailId.set(null); this.showReject.set(false); }
    else { this.detail.set(w); this.detailId.set(w._id); this.showReject.set(false); this.rejectReason.set(''); }
  }

  approve(w: AdminWithdrawal) {
    this.actionLoading.set(w._id);
    this.admin.approveWithdrawal(w._id).subscribe(res => {
      this.actionLoading.set(null);
      this.msg(res.success ? 'Withdrawal approved' : 'Approval failed', res.success ? 'success' : 'error');
      if (res.success) { this.detail.set(null); this.detailId.set(null); this.load(); }
    });
  }

  reject(w: AdminWithdrawal) {
    if (!this.rejectReason().trim()) return;
    this.actionLoading.set(w._id);
    this.admin.rejectWithdrawal(w._id, this.rejectReason()).subscribe(res => {
      this.actionLoading.set(null);
      this.msg(res.success ? 'Withdrawal rejected & refunded' : 'Rejection failed', res.success ? 'success' : 'error');
      if (res.success) { this.showReject.set(false); this.detail.set(null); this.detailId.set(null); this.load(); }
    });
  }

  reverse(w: AdminWithdrawal) {
    this.actionLoading.set(w._id);
    this.admin.reverseWithdrawal(w._id).subscribe(res => {
      this.actionLoading.set(null);
      this.confirmAction.set(null);
      if (res.success) {
        this.msg('Withdrawal reversed — funds returned to user', 'success');
        this.detail.set(null); this.detailId.set(null); this.load();
      } else {
        this.msg(res.data?.message || 'Reverse failed', 'error');
      }
    });
  }

  retry(w: AdminWithdrawal) {
    this.actionLoading.set(w._id);
    this.admin.retryWithdrawal(w._id).subscribe(res => {
      this.actionLoading.set(null);
      this.confirmAction.set(null);
      if (res.success) {
        this.msg('Retry initiated — awaiting Paystack confirmation', 'success');
        this.detail.set(null); this.detailId.set(null); this.load();
      } else {
        this.msg(res.data?.message || 'Retry failed', 'error');
      }
    });
  }

  private msg(text: string, type: 'success' | 'error') {
    this.snackBar.open(text, 'Close', { duration: 4000, panelClass: type === 'success' ? 'snack-success' : 'snack-error' });
  }
}
