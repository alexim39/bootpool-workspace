import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgIf, DatePipe, DecimalPipe, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminWithdrawal } from '../services';
import { AdminWithdrawMgtStore } from './stores/admin-withdraw-mgt.store';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-withdraw-mgt',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, JsonPipe, FormsModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatTooltipModule, MatSnackBarModule],
  templateUrl: './withdraw-mgt.component.html',
  styleUrls: ['./withdraw-mgt.component.scss']
})
export class WithdrawMgtComponent implements OnInit, OnDestroy {
  readonly store = inject(AdminWithdrawMgtStore);
  protected Math = Math;
  protected showProvider = false;

  ngOnInit() { this.store.load(); }
  ngOnDestroy() { this.store.destroy(); }

  statusColor(s: string): string {
    const map: Record<string, string> = {
      completed: '#00E676', pending: '#E8B923', processing: '#90CAF9',
      failed: '#f44336', cancelled: '#666', reversed: '#CE93D8'
    };
    return map[s] || '#555';
  }

  isActionable(w: AdminWithdrawal): boolean { return w.status === 'pending' || w.status === 'processing' || w.status === 'failed'; }

  canApprove(w: AdminWithdrawal): boolean { return w.status === 'pending'; }
  canReverse(w: AdminWithdrawal): boolean { return w.status === 'processing' || w.status === 'pending'; }
  canRetry(w: AdminWithdrawal): boolean { return w.status === 'failed'; }

  statusStyle(s: string): any {
    const c = this.statusColor(s);
    return { background: c + '18', color: c, borderColor: c + '30' };
  }

  providerDataStr(w: AdminWithdrawal): string {
    if (!w.providerData) return '—';
    const d = w.providerData;
    const parts: string[] = [];
    if (d['transfer_code']) parts.push(`Transfer: ${d['transfer_code']}`);
    if (d['recipient_code']) parts.push(`Recipient: ${d['recipient_code']}`);
    if (d['transfer_status']) parts.push(`Status: ${d['transfer_status']}`);
    if (d['reversalType']) parts.push(`Reversal: ${d['reversalType']}`);
    if (d['retryAttemptAt']) parts.push(`Retry: ${new Date(d['retryAttemptAt']).toLocaleDateString()}`);
    return parts.join(' | ') || JSON.stringify(d).substring(0, 120);
  }
}
