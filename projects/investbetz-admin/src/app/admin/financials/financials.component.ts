import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminFinancialsStore } from './stores/admin-financials.store';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-financials',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe, SlicePipe, FormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatTooltipModule
  ],
  templateUrl: './financials.component.html',
  styleUrls: ['./financials.component.scss']
})
export class FinancialsComponent implements OnInit {
  readonly store = inject(AdminFinancialsStore);
  wdColumns = ['reference', 'user', 'amount', 'fee', 'account', 'status', 'date', 'actions'];
  txColumns = ['reference', 'user', 'type', 'amount', 'fee', 'status', 'date', 'actions'];

  ngOnInit() {
    this.store.refreshAll();
  }

  barHeight(volume: number): number {
    const max = Math.max(...(this.store.dashData().dailyVolume || []).map(d => d.volume), 1);
    return (volume / max) * 100;
  }

  isDebit(type: string): boolean { return ['debit', 'withdrawal', 'stake'].includes(type); }
  isCredit(type: string): boolean { return ['credit', 'deposit', 'payout', 'refund'].includes(type); }

  typeColor(t: string): string {
    const map: Record<string, string> = { deposit: '#00E676', withdrawal: '#f44336', stake: '#E8B923', payout: '#00E676', refund: '#888', adjustment: '#2196f3' };
    return map[t] || '#555';
  }

  statusColor(s: string): string {
    return s === 'completed' ? '#00E676' : s === 'pending' ? '#E8B923' : s === 'processing' ? '#90CAF9' : s === 'failed' ? '#f44336' : s === 'cancelled' ? '#666' : '#555';
  }

  txStatusColor(s: string): string {
    const map: Record<string, string> = { completed: '#00E676', pending: '#E8B923', failed: '#f44336', cancelled: '#666' };
    return map[s] || '#555';
  }

  clearWdFilters() {
    this.store.wdFilter.set({ status: '', search: '', dateFrom: '', dateTo: '' });
    this.store.wdPage.set(1);
    this.store.loadWithdrawals();
  }

  clearTxFilters() {
    this.store.txFilter.set({ type: '', status: '', search: '', dateFrom: '', dateTo: '' });
    this.store.txPage.set(1);
    this.store.loadTransactions();
  }
}
