import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { AdminService, AdminTransaction } from '../services/admin.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, SlicePipe, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatPaginatorModule],
  template: `
    <div class="txn-page">
      <div class="page-header">
        <h1>Transactions</h1>
        <button mat-raised-button class="btn-adjust" (click)="showAdjustForm = true">
          <mat-icon>account_balance_wallet</mat-icon> Manual Adjustment
        </button>
      </div>

      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="fill" class="filter-field">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="typeFilter" (selectionChange)="onFilterChange()">
              <mat-option value="">All</mat-option>
              <mat-option value="deposit">Deposit</mat-option>
              <mat-option value="withdrawal">Withdrawal</mat-option>
              <mat-option value="stake">Stake</mat-option>
              <mat-option value="payout">Payout</mat-option>
              <mat-option value="refund">Refund</mat-option>
              <mat-option value="adjustment">Adjustment</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="fill" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="onFilterChange()">
              <mat-option value="">All</mat-option>
              <mat-option value="completed">Completed</mat-option>
              <mat-option value="pending">Pending</mat-option>
              <mat-option value="failed">Failed</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <mat-card class="table-card">
        <div class="loading-shim" *ngIf="loading">
          <div class="spinner"></div>
        </div>
        <table mat-table [dataSource]="txns" class="admin-table">
          <ng-container matColumnDef="reference">
            <th mat-header-cell *matHeaderCellDef>Reference</th>
            <td mat-cell *matCellDef="let t">{{ t.reference | slice:0:16 }}</td>
          </ng-container>
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>User</th>
            <td mat-cell *matCellDef="let t">{{ t.user?.phone || t.userId | slice:0:10 }}</td>
          </ng-container>
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let t">
              <span class="chip" [style.background]="typeColor(t.type)">{{ t.type }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Amount</th>
            <td mat-cell *matCellDef="let t" [style.color]="isDebit(t.type) ? '#f44336' : '#00E676'">
              {{ isCredit(t.type) ? '+' : '-' }}\u20A6{{ t.amount | number }}
            </td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let t">
              <span class="chip" [style.background]="txnStatusColor(t.status)">{{ t.status }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let t">{{ t.createdAt | date:'short' }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
        <div class="empty-state" *ngIf="!loading && txns.length === 0">No transactions found</div>
        <mat-paginator *ngIf="totalPages > 1"
          [length]="total"
          [pageSize]="limit"
          [pageIndex]="page - 1"
          [pageSizeOptions]="[10, 20, 50, 100]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      </mat-card>
    </div>

    <div class="modal-overlay" *ngIf="showAdjustForm" (click)="showAdjustForm = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Manual Wallet Adjustment</h2>
          <button mat-icon-button (click)="showAdjustForm = false"><mat-icon>close</mat-icon></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>User ID</mat-label>
              <input matInput [(ngModel)]="adjustData.userId" placeholder="MongoDB User ID">
            </mat-form-field>
          </div>
          <div class="form-row">
            <mat-form-field appearance="fill" class="half">
              <mat-label>Amount (NGN)</mat-label>
              <input matInput type="number" [(ngModel)]="adjustData.amount" placeholder="1000">
            </mat-form-field>
            <mat-form-field appearance="fill" class="half">
              <mat-label>Type</mat-label>
              <mat-select [(ngModel)]="adjustData.type">
                <mat-option value="credit">Credit</mat-option>
                <mat-option value="debit">Debit</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="form-group">
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Reason</mat-label>
              <input matInput [(ngModel)]="adjustData.reason" placeholder="e.g. Signup bonus, correction">
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-button (click)="showAdjustForm = false">Cancel</button>
            <button mat-raised-button color="primary" (click)="submitAdjustment()" [disabled]="!adjustData.userId || !adjustData.amount || !adjustData.reason">
              <mat-icon>check</mat-icon> Submit
            </button>
          </div>
          <div class="result-msg" *ngIf="adjustResult" [style.color]="adjustResult.success ? '#00E676' : '#f44336'">
            {{ adjustResult.message }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .txn-page { max-width: 1400px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-header h1 { color: #fff; font-size: 24px; font-weight: 600; margin: 0; }
    .btn-adjust { background: #E8B923 !important; color: #0A1428 !important; font-weight: 600; }
    .filter-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 16px; padding: 8px 16px; }
    .filters { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .filter-field { width: 200px; }
    .table-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); position: relative; }
    .admin-table { width: 100%; }
    ::ng-deep .admin-table .mat-mdc-header-cell { color: rgba(255,255,255,0.5) !important; font-size: 12px !important; font-weight: 600 !important; text-transform: uppercase !important; border-bottom-color: rgba(255,255,255,0.08) !important; }
    ::ng-deep .admin-table .mat-mdc-cell { color: rgba(255,255,255,0.8) !important; font-size: 13px !important; border-bottom-color: rgba(255,255,255,0.05) !important; }
    ::ng-deep .mat-mdc-paginator { background: transparent !important; color: rgba(255,255,255,0.7) !important; border-top: 1px solid rgba(255,255,255,0.06); }
    ::ng-deep .mat-mdc-paginator .mat-mdc-paginator-navigation-button { color: rgba(255,255,255,0.6) !important; }
    ::ng-deep .mat-mdc-paginator .mat-mdc-select-value-text { color: rgba(255,255,255,0.7) !important; }
    .chip { padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #fff; text-transform: capitalize; }
    .empty-state { padding: 32px; text-align: center; color: rgba(255,255,255,0.3); font-size: 14px; }
    .loading-shim { position: absolute; inset: 0; background: rgba(10,20,40,0.6); z-index: 10; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(0,230,118,0.2); border-top-color: #00E676; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
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
    ::ng-deep .mdc-text-field--filled:not(.mdc-text-field--disabled) { background-color: rgba(255,255,255,0.05); }
    ::ng-deep .mat-mdc-form-field-label { color: rgba(255,255,255,0.5); }
    ::ng-deep .mat-mdc-input-element { color: #fff; }
    ::ng-deep .mdc-floating-label { color: rgba(255,255,255,0.5) !important; }
  `]
})
export class TransactionsComponent implements OnInit, OnDestroy {
  txns: AdminTransaction[] = [];
  total = 0;
  page = 1;
  limit = 20;
  totalPages = 0;
  typeFilter = '';
  statusFilter = '';
  loading = false;
  columns = ['reference', 'user', 'type', 'amount', 'status', 'createdAt'];
  showAdjustForm = false;
  adjustData = { userId: '', amount: 0, type: 'credit' as 'credit' | 'debit', reason: '' };
  adjustResult: { success: boolean; message: string } | null = null;
  private destroy$ = new Subject<void>();

  constructor(private admin: AdminService) {}

  ngOnInit() {
    this.loadTxns();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTxns() {
    this.loading = true;
    this.admin.getTransactions({
      page: this.page,
      limit: this.limit,
      type: this.typeFilter || undefined,
      status: this.statusFilter || undefined
    }).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) {
        this.txns = res.data.items;
        this.total = res.data.total;
        this.page = res.data.page;
        this.limit = res.data.limit;
        this.totalPages = res.data.totalPages;
      }
      this.loading = false;
    });
  }

  onFilterChange() {
    this.page = 1;
    this.loadTxns();
  }

  onPageChange(e: PageEvent) {
    this.page = e.pageIndex + 1;
    this.limit = e.pageSize;
    this.loadTxns();
  }

  isDebit(type: string): boolean {
    return ['debit', 'withdrawal', 'stake'].includes(type);
  }

  isCredit(type: string): boolean {
    return ['credit', 'deposit', 'payout', 'refund'].includes(type);
  }

  submitAdjustment() {
    this.admin.adjustWallet(this.adjustData.userId, this.adjustData.amount, this.adjustData.type, this.adjustData.reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.adjustResult = { success: true, message: res.message || 'Adjustment successful' };
          setTimeout(() => { this.showAdjustForm = false; this.adjustResult = null; this.loadTxns(); }, 1500);
        },
        error: (err) => {
          this.adjustResult = { success: false, message: err.error?.message || 'Adjustment failed' };
        }
      });
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
