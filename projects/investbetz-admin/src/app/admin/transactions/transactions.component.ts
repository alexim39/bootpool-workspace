import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgIf, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { AdminTransactionsStore } from './stores/admin-transactions.store';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, SlicePipe, FormsModule,
    MatTableModule, MatSortModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatPaginatorModule,
    MatDatepickerModule, MatNativeDateModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit, OnDestroy {
  readonly store = inject(AdminTransactionsStore);
  readonly columns = ['reference', 'user', 'type', 'amount', 'fee', 'status', 'createdAt'];
  adjustData = { userId: '', amount: 0, type: 'credit' as 'credit' | 'debit', reason: '' };

  ngOnInit() {
    this.store.loadTxns();
  }

  ngOnDestroy() {
    this.store.destroy();
  }

  onPageChange(e: PageEvent) {
    this.store.onPageChange(e);
  }

  onSortChange(sort: Sort) {
    this.store.setSort(sort);
  }

  get sortDir(): SortDirection {
    return this.store.sortOrder() as SortDirection;
  }

  goToPage() {
    const p = parseInt(this.store.goToPageInput(), 10);
    if (!isNaN(p)) this.store.goToPage(p);
    this.store.goToPageInput.set('');
  }

  quickDate(preset: string) {
    const now = new Date();
    let from: Date;
    switch (preset) {
      case 'today': from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case '7d': from = new Date(now.getTime() - 7 * 86400000); break;
      case '30d': from = new Date(now.getTime() - 30 * 86400000); break;
      case 'month': from = new Date(now.getFullYear(), now.getMonth(), 1); break;
      default: return;
    }
    this.store.setDateRange(from.toISOString(), now.toISOString());
  }

  isDebit(type: string): boolean {
    return ['debit', 'withdrawal', 'stake'].includes(type);
  }

  isCredit(type: string): boolean {
    return ['credit', 'deposit', 'payout', 'refund'].includes(type);
  }

  trackByFn(_: number, t: any): string { return t._id || t.id; }

  submitAdjustment() {
    this.store.submitAdjustment(this.adjustData);
  }

  typeColor(t: string): string {
    const map: Record<string, string> = { deposit: '#00E676', withdrawal: '#f44336', stake: '#E8B923', payout: '#00E676', refund: '#888', adjustment: '#2196f3' };
    return map[t] || '#555';
  }

  txnStatusColor(s: string): string {
    const map: Record<string, string> = { completed: '#00E676', pending: '#E8B923', failed: '#f44336', processing: '#2196f3', cancelled: '#888', reversed: '#ff9800' };
    return map[s] || '#555';
  }
}
