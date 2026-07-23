import { Injectable, inject, signal } from '@angular/core';
import { AdminService, AdminTransaction } from '../../services';

@Injectable({ providedIn: 'root' })
export class AdminDepositMgtStore {
  private admin = inject(AdminService);

  readonly deposits = signal<AdminTransaction[]>([]);
  readonly loading = signal(false);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly statusFilter = signal('');
  readonly detail = signal<AdminTransaction | null>(null);
  readonly detailId = signal<string | null>(null);

  readonly columns = ['ref', 'user', 'amount', 'fee', 'status', 'date', 'actions'];

  load() {
    this.loading.set(true);
    this.detail.set(null);
    this.detailId.set(null);
    this.admin.getTransactions({ page: this.page(), limit: this.limit(), type: 'deposit', status: this.statusFilter() || undefined }).subscribe(res => {
      if (res.success) {
        this.deposits.set(res.data.items);
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

  toggleDetail(d: AdminTransaction) {
    if (this.detailId() === d.id) {
      this.detail.set(null);
      this.detailId.set(null);
    } else {
      this.detail.set(d);
      this.detailId.set(d.id);
    }
  }
}
