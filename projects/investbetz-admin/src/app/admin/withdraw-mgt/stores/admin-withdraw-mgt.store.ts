import { Injectable, inject, signal } from '@angular/core';
import { AdminService, AdminWithdrawal } from '../../services';

@Injectable({ providedIn: 'root' })
export class AdminWithdrawMgtStore {
  private admin = inject(AdminService);

  readonly withdrawals = signal<AdminWithdrawal[]>([]);
  readonly loading = signal(false);
  readonly actionLoading = signal(false);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly statusFilter = signal('');
  readonly detail = signal<AdminWithdrawal | null>(null);
  readonly detailId = signal<string | null>(null);
  readonly showReject = signal(false);
  readonly rejectReason = signal('');

  readonly columns = ['user', 'amount', 'fee', 'bank', 'account', 'status', 'date', 'actions'];

  load() {
    this.loading.set(true);
    this.detail.set(null);
    this.detailId.set(null);
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

  onFilterChange() {
    this.page.set(1);
    this.load();
  }

  goTo(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.load();
  }

  toggleDetail(w: AdminWithdrawal) {
    if (this.detailId() === w._id) {
      this.detail.set(null);
      this.detailId.set(null);
      this.showReject.set(false);
    } else {
      this.detail.set(w);
      this.detailId.set(w._id);
      this.showReject.set(false);
      this.rejectReason.set('');
    }
  }

  approve(w: AdminWithdrawal) {
    this.actionLoading.set(true);
    this.admin.approveWithdrawal(w._id).subscribe(res => {
      this.actionLoading.set(false);
      if (res.success) this.load();
    });
  }

  reject(w: AdminWithdrawal) {
    if (!this.rejectReason().trim()) return;
    this.actionLoading.set(true);
    this.admin.rejectWithdrawal(w._id, this.rejectReason()).subscribe(res => {
      this.actionLoading.set(false);
      if (res.success) {
        this.showReject.set(false);
        this.load();
      }
    });
  }
}
