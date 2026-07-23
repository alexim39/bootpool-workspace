import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgIf, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { AdminTransactionsStore } from './stores/admin-transactions.store';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, SlicePipe, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatPaginatorModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit, OnDestroy {
  readonly store = inject(AdminTransactionsStore);
  readonly columns = ['reference', 'user', 'type', 'amount', 'status', 'createdAt'];
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

  isDebit(type: string): boolean {
    return ['debit', 'withdrawal', 'stake'].includes(type);
  }

  isCredit(type: string): boolean {
    return ['credit', 'deposit', 'payout', 'refund'].includes(type);
  }

  submitAdjustment() {
    this.store.submitAdjustment(this.adjustData);
  }

  typeColor(t: string): string {
    const map: Record<string, string> = { deposit: '#00E676', withdrawal: '#f44336', stake: '#E8B923', payout: '#00E676', refund: '#888', adjustment: '#2196f3' };
    return map[t] || '#555';
  }

  txnStatusColor(s: string): string {
    const map: Record<string, string> = { completed: '#00E676', pending: '#E8B923', failed: '#f44336' };
    return map[s] || '#555';
  }
}
