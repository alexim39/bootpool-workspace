import { Injectable, inject, signal } from '@angular/core';
import { AdminService, AdminWithdrawal } from '../../services';

@Injectable({ providedIn: 'root' })
export class AdminWithdrawalsStore {
  private admin = inject(AdminService);

  readonly items = signal<AdminWithdrawal[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly totalPages = signal(0);
  readonly statusFilter = signal('');
  readonly selectedWdr = signal<AdminWithdrawal | null>(null);
  readonly rejectTarget = signal<AdminWithdrawal | null>(null);
  readonly rejectReason = signal('');
  readonly loading = signal(false);

  readonly columns = ['reference', 'user', 'amount', 'status', 'date', 'actions'];

  load() {
    this.loading.set(true);
    this.admin.getWithdrawals({ page: this.page(), limit: this.limit(), status: this.statusFilter() || undefined })
      .subscribe(res => {
        if (res.success) {
          this.items.set(res.data.items);
          this.total.set(res.data.total);
          this.page.set(res.data.page);
          this.limit.set(res.data.limit);
          this.totalPages.set(res.data.totalPages);
        }
        this.loading.set(false);
      });
  }

  onFilterChange() {
    this.page.set(1);
    this.load();
  }

  onPageChange(index: number, pageSize: number) {
    this.page.set(index + 1);
    this.limit.set(pageSize);
    this.load();
  }

  selectWdr(w: AdminWithdrawal) {
    this.admin.getWithdrawal(w._id || w.id).subscribe(res => {
      if (res.success) this.selectedWdr.set(res.data);
    });
  }

  approve(w: AdminWithdrawal) {
    this.admin.approveWithdrawal(w._id || w.id).subscribe(() => {
      this.selectedWdr.set(null);
      this.load();
    });
  }

  reject(w: AdminWithdrawal) {
    if (!this.rejectReason().trim()) return;
    this.admin.rejectWithdrawal(w._id || w.id, this.rejectReason()).subscribe(() => {
      this.rejectTarget.set(null);
      this.rejectReason.set('');
      this.selectedWdr.set(null);
      this.load();
    });
  }
}
