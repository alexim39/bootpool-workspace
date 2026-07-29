import { Injectable, inject, signal } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService, AdminTransaction, TxStats } from '../../services';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

@Injectable({ providedIn: 'root' })
export class AdminTransactionsStore {
  private admin = inject(AdminService);
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  readonly txns = signal<AdminTransaction[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly totalPages = signal(0);
  readonly stats = signal<TxStats | null>(null);
  readonly typeFilter = signal('');
  readonly statusFilter = signal('');
  readonly search = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly sortBy = signal('createdAt');
  readonly sortOrder = signal<'asc' | 'desc' | ''>('desc');
  readonly loading = signal(false);
  readonly showAdjustForm = signal(false);
  readonly adjustResult = signal<{ success: boolean; message: string } | null>(null);
  readonly goToPageInput = signal('');

  constructor() {
    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.loadTxns());
  }

  destroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setSearch(val: string) {
    this.search.set(val);
    this.page.set(1);
    this.search$.next(val);
  }

  setDateRange(from: string, to: string) {
    this.dateFrom.set(from);
    this.dateTo.set(to);
    this.page.set(1);
    this.loadTxns();
  }

  clearDateRange() {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.page.set(1);
    this.loadTxns();
  }

  setSort(sort: Sort) {
    this.sortBy.set(sort.active || 'createdAt');
    this.sortOrder.set(sort.direction || 'desc');
    this.loadTxns();
  }

  loadTxns() {
    this.loading.set(true);
    this.admin.getTransactions({
      page: this.page(),
      limit: this.limit(),
      type: this.typeFilter() || undefined,
      status: this.statusFilter() || undefined,
      search: this.search() || undefined,
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder()
    }).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) {
        this.txns.set(res.data.items);
        this.total.set(res.data.total);
        this.page.set(res.data.page);
        this.limit.set(res.data.limit);
        this.totalPages.set(res.data.totalPages);
        this.stats.set(res.data.stats);
      }
      this.loading.set(false);
    });
  }

  onFilterChange() {
    this.page.set(1);
    this.loadTxns();
  }

  onPageChange(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.limit.set(e.pageSize);
    this.loadTxns();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.loadTxns();
  }

  exportCsv() {
    const rows = this.txns().map(t => [
      t.reference,
      t.user?.phone || t.userId,
      t.type,
      t.amount,
      t.fee || 0,
      t.amount - (t.fee || 0),
      t.status,
      t.provider || '',
      t.createdAt
    ]);
    const header = 'Reference,User,Type,Amount,Fee,Net Amount,Status,Provider,Date\n';
    const csv = header + rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  submitAdjustment(adjustData: { userId: string; amount: number; type: 'credit' | 'debit'; reason: string }) {
    this.admin.adjustWallet(adjustData.userId, adjustData.amount, adjustData.type, adjustData.reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.adjustResult.set({ success: true, message: res.message || 'Adjustment successful' });
          setTimeout(() => { this.showAdjustForm.set(false); this.adjustResult.set(null); this.loadTxns(); }, 1500);
        },
        error: (err) => {
          this.adjustResult.set({ success: false, message: err.error?.message || 'Adjustment failed' });
        }
      });
  }
}
