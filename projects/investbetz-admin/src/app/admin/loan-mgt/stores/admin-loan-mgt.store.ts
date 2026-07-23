import { Injectable, inject, signal } from '@angular/core';
import { AdminService, AdminLoan } from '../../services';

@Injectable({ providedIn: 'root' })
export class AdminLoanMgtStore {
  private admin = inject(AdminService);

  readonly loans = signal<AdminLoan[]>([]);
  readonly loading = signal(false);
  readonly actionLoading = signal(false);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly statusFilter = signal('');
  readonly detail = signal<AdminLoan | null>(null);
  readonly detailId = signal<string | null>(null);
  readonly showReject = signal(false);
  readonly rejectReason = signal('');
  readonly showCreate = signal(false);

  loadLoans() {
    this.loading.set(true);
    this.detail.set(null);
    this.detailId.set(null);
    this.admin.getLoans({ page: this.page(), limit: this.limit(), status: this.statusFilter() || undefined }).subscribe(res => {
      if (res.success) {
        this.loans.set(res.data.items);
        this.total.set(res.data.total);
        this.page.set(res.data.page);
        this.totalPages.set(res.data.totalPages);
      }
      this.loading.set(false);
    });
  }

  onFilterChange() {
    this.page.set(1);
    this.loadLoans();
  }

  goTo(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadLoans();
  }

  approve(l: AdminLoan) {
    this.actionLoading.set(true);
    this.admin.approveLoan(l._id).subscribe(res => {
      this.actionLoading.set(false);
      if (res.success) this.loadLoans();
    });
  }

  reject(l: AdminLoan) {
    if (!this.rejectReason().trim()) return;
    this.actionLoading.set(true);
    this.admin.rejectLoan(l._id, this.rejectReason()).subscribe(res => {
      this.actionLoading.set(false);
      if (res.success) {
        this.showReject.set(false);
        this.loadLoans();
      }
    });
  }

  repay(l: AdminLoan) {
    this.actionLoading.set(true);
    this.admin.repayLoan(l._id).subscribe(res => {
      this.actionLoading.set(false);
      if (res.success) this.loadLoans();
    });
  }

  createLoan(data: { userId: string; amount: number; purpose: string; interestRate?: number; dueDate?: string }) {
    if (!data.userId || !data.amount || !data.purpose) return;
    this.actionLoading.set(true);
    this.admin.createLoan({
      userId: data.userId,
      amount: data.amount,
      purpose: data.purpose,
      interestRate: data.interestRate || undefined,
      dueDate: data.dueDate || undefined
    }).subscribe(res => {
      this.actionLoading.set(false);
      if (res.success) {
        this.showCreate.set(false);
        this.loadLoans();
      }
    });
  }
}
