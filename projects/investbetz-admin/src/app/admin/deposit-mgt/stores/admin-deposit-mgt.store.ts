import { Injectable, inject, signal } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService, AdminTransaction, TxStats } from '../../services';
import { Sort } from '@angular/material/sort';

@Injectable({ providedIn: 'root' })
export class AdminDepositMgtStore {
  private admin = inject(AdminService);
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  readonly deposits = signal<AdminTransaction[]>([]);
  readonly loading = signal(false);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly stats = signal<TxStats | null>(null);
  readonly statusFilter = signal('');
  readonly search = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly sortBy = signal('createdAt');
  readonly sortOrder = signal<'asc' | 'desc' | ''>('desc');
  readonly detail = signal<AdminTransaction | null>(null);
  readonly detailId = signal<string | null>(null);
  readonly goToPageInput = signal('');

  readonly columns = ['ref', 'user', 'amount', 'fee', 'status', 'date', 'actions'];

  constructor() {
    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.load());
  }

  destroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setSearch(val: string) {
    this.search.set(val);
    this.page.set(1);
    this.detail.set(null);
    this.detailId.set(null);
    this.search$.next(val);
  }

  setDateRange(from: string, to: string) {
    this.dateFrom.set(from);
    this.dateTo.set(to);
    this.page.set(1);
    this.load();
  }

  clearDateRange() {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.page.set(1);
    this.load();
  }

  setSort(sort: Sort) {
    this.sortBy.set(sort.active || 'createdAt');
    this.sortOrder.set(sort.direction || 'desc');
    this.load();
  }

  load() {
    this.loading.set(true);
    this.admin.getTransactions({
      page: this.page(),
      limit: this.limit(),
      type: 'deposit',
      status: this.statusFilter() || undefined,
      search: this.search() || undefined,
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder()
    }).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) {
        this.deposits.set(res.data.items);
        this.total.set(res.data.total);
        this.page.set(res.data.page);
        this.totalPages.set(res.data.totalPages);
        this.stats.set(res.data.stats);
      }
      this.loading.set(false);
    });
  }

  onFilterChange() {
    this.page.set(1);
    this.detail.set(null);
    this.detailId.set(null);
    this.load();
  }

  goTo(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.load();
  }

  goToPageFromInput() {
    const p = parseInt(this.goToPageInput(), 10);
    if (!isNaN(p)) this.goTo(p);
    this.goToPageInput.set('');
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

  exportCsv() {
    const rows = this.deposits().map(d => [
      d.reference,
      d.user?.phone || d.userId,
      d.amount,
      d.fee || 0,
      d.amount - (d.fee || 0),
      d.status,
      d.provider || '',
      d.metadata?.description || '',
      d.createdAt
    ]);
    const header = 'Reference,User,Amount,Fee,Net Amount,Status,Provider,Description,Date\n';
    const csv = header + rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deposits_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
