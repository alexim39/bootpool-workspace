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
    NgIf, NgFor, DatePipe, DecimalPipe, SlicePipe, FormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatTooltipModule
  ],
  templateUrl: './financials.component.html',
  styles: [`
    .fin-page { max-width: 1400px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .page-header h1 { color: #fff; font-size: 24px; font-weight: 600; margin: 0; }
    .header-actions { display: flex; gap: 8px; }
    .btn-adjust { background: #E8B923 !important; color: #0A1428 !important; font-weight: 600 !important; font-size: 12px !important; }
    .btn-refresh { color: #90CAF9 !important; border-color: #90CAF9 !important; font-size: 12px !important; }
    .btn-submit { background: #00E676 !important; color: #0A1428 !important; font-weight: 600 !important; }

    .summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .summary-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); padding: 16px; display: flex; align-items: center; gap: 14px; }
    .sum-icon { font-size: 32px; width: 32px; height: 32px; }
    .card-volume .sum-icon { color: #90CAF9; }
    .card-payout .sum-icon { color: #CE93D8; }
    .card-deposits .sum-icon { color: #00E676; }
    .card-withdrawals .sum-icon { color: #f44336; }
    .card-pending .sum-icon { color: #E8B923; }
    .card-revenue .sum-icon { color: #00E676; }
    .sum-info { display: flex; flex-direction: column; }
    .sum-label { color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .sum-value { color: #fff; font-size: 20px; font-weight: 700; }
    .sum-sub { color: rgba(255,255,255,0.3); font-size: 11px; }

    .tab-bar { display: flex; gap: 4px; margin-bottom: 16px; background: #0D1A30; border-radius: 10px; padding: 4px; border: 1px solid rgba(255,255,255,0.06); }
    .tab-btn { flex: 1; padding: 10px 16px; border: none; background: transparent; color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .tab-btn.active { background: rgba(0,230,118,0.12); color: #00E676; }
    .tab-btn:hover:not(.active) { background: rgba(255,255,255,0.04); color: #fff; }
    .tab-badge { background: #E8B923; color: #0A1428; font-size: 10px; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 5px; }

    .section-title { color: #fff; font-size: 14px; font-weight: 600; margin: 0 0 12px; }
    .volume-section { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); padding: 20px; margin-bottom: 16px; }
    .bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 160px; padding-top: 8px; }
    .bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
    .bar-track { width: 100%; max-width: 40px; height: 100px; background: rgba(255,255,255,0.04); border-radius: 6px; position: relative; overflow: hidden; display: flex; align-items: flex-end; }
    .bar-fill { width: 100%; background: linear-gradient(180deg, #00E676, #00C853); border-radius: 6px; transition: height 0.5s ease; min-height: 4px; }
    .bar-value { color: rgba(255,255,255,0.3); font-size: 9px; white-space: nowrap; }
    .bar-label { color: rgba(255,255,255,0.3); font-size: 10px; }

    .section-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); padding: 20px; position: relative; min-height: 100px; }
    .filter-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 16px; padding: 8px 16px; }
    .filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .filter-select { width: 200px; }
    .filter-count { color: rgba(255,255,255,0.3); font-size: 12px; margin-left: auto; }
    .table-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); position: relative; min-height: 200px; }
    .loading-overlay, .loading-shim { position: absolute; inset: 0; background: rgba(13,26,48,0.7); display: flex; align-items: center; justify-content: center; z-index: 10; border-radius: 12px; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(0,230,118,0.2); border-top-color: #00E676; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .admin-table { width: 100%; }
    ::ng-deep .admin-table .mat-mdc-header-cell { color: rgba(255,255,255,0.5) !important; font-size: 11px !important; font-weight: 600 !important; text-transform: uppercase !important; border-bottom-color: rgba(255,255,255,0.08) !important; background: transparent !important; }
    ::ng-deep .admin-table .mat-mdc-cell { color: rgba(255,255,255,0.8) !important; font-size: 13px !important; border-bottom-color: rgba(255,255,255,0.05) !important; background: transparent !important; }
    .cell-ref { font-family: monospace; font-size: 12px !important; color: rgba(255,255,255,0.5) !important; }
    .cell-amount { font-weight: 700 !important; }
    .chip { padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #fff; text-transform: capitalize; }
    .paginator { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
    .page-info { color: rgba(255,255,255,0.3); font-size: 12px; }
    .empty-state { padding: 48px 24px; text-align: center; color: rgba(255,255,255,0.3); font-size: 13px; }
    .detail-panel { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 16px; padding: 20px; }
    .detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
    .detail-header h3 { color: #fff; font-size: 16px; font-weight: 600; margin: 0; }
    .detail-actions { display: flex; align-items: center; gap: 8px; }
    .btn-approve { color: #00E676 !important; border-color: #00E676 !important; font-size: 12px !important; }
    .btn-reject { color: #f44336 !important; border-color: #f44336 !important; font-size: 12px !important; }
    .btn-cancel { color: rgba(255,255,255,0.5) !important; border-color: rgba(255,255,255,0.2) !important; font-size: 12px !important; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .d-label { color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .d-value { color: #fff; font-size: 14px; font-weight: 500; }
    .reject-form { margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 12px; }
    .reject-input { width: 100%; }
    .reject-actions { display: flex; gap: 8px; justify-content: flex-end; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: #0D1A30; border-radius: 12px; width: 100%; max-width: 500px; border: 1px solid rgba(255,255,255,0.08); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .modal-header h2 { color: #fff; font-size: 18px; font-weight: 600; margin: 0; }
    .modal-header button { color: rgba(255,255,255,0.5); }
    .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .form-group { width: 100%; }
    .form-row { display: flex; gap: 16px; }
    .half { flex: 1; }
    .full-width { width: 100%; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
    .result-msg { padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 13px; text-align: center; }
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    ::ng-deep .mat-mdc-select-value-text { color: #fff !important; }
    ::ng-deep .mat-mdc-select-arrow { color: rgba(255,255,255,0.3) !important; }
    ::ng-deep .mat-mdc-text-field-wrapper { background: rgba(255,255,255,0.04) !important; border-radius: 8px !important; }
    ::ng-deep .mdc-floating-label { color: rgba(255,255,255,0.3) !important; font-size: 12px !important; }
    ::ng-deep input.mat-mdc-input-element { color: #fff !important; }
    ::ng-deep .mdc-line-ripple { display: none; }
  `]
})
export class FinancialsComponent implements OnInit {
  readonly store = inject(AdminFinancialsStore);
  wdColumns = ['user', 'amount', 'account', 'status', 'date', 'actions'];
  txColumns = ['reference', 'user', 'type', 'amount', 'status', 'date', 'actions'];

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
}
