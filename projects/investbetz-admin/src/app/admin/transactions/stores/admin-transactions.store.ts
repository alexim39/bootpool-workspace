import { Injectable, inject, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AdminService, AdminTransaction } from '../../services';
import { PageEvent } from '@angular/material/paginator';

@Injectable({ providedIn: 'root' })
export class AdminTransactionsStore {
  private admin = inject(AdminService);
  private destroy$ = new Subject<void>();

  readonly txns = signal<AdminTransaction[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly totalPages = signal(0);
  readonly typeFilter = signal('');
  readonly statusFilter = signal('');
  readonly loading = signal(false);
  readonly showAdjustForm = signal(false);
  readonly adjustResult = signal<{ success: boolean; message: string } | null>(null);

  destroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTxns() {
    this.loading.set(true);
    this.admin.getTransactions({
      page: this.page(),
      limit: this.limit(),
      type: this.typeFilter() || undefined,
      status: this.statusFilter() || undefined
    }).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) {
        this.txns.set(res.data.items);
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
    this.loadTxns();
  }

  onPageChange(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.limit.set(e.pageSize);
    this.loadTxns();
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
