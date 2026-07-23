import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminWithdrawal } from '../services/admin.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-withdraw-mgt',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, FormsModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatTooltipModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Withdrawal Management</h1>
        <span class="header-count">{{ total }} withdrawals</span>
      </div>

      <mat-card class="filter-card">
        <div class="filter-row">
          <mat-form-field appearance="outline" class="filter-select">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="onFilterChange()">
              <mat-option value="">All</mat-option>
              <mat-option value="pending">Pending</mat-option>
              <mat-option value="processing">Processing</mat-option>
              <mat-option value="completed">Completed</mat-option>
              <mat-option value="failed">Failed</mat-option>
              <mat-option value="cancelled">Cancelled</mat-option>
            </mat-select>
          </mat-form-field>
          <div class="filter-spacer"></div>
          <button mat-stroked-button class="btn-refresh" (click)="loadWithdrawals()">
            <mat-icon>refresh</mat-icon> Refresh
          </button>
        </div>
      </mat-card>

      <mat-card class="table-card">
        <div class="loading-overlay" *ngIf="loading">
          <div class="spinner"></div>
        </div>
        <table mat-table [dataSource]="withdrawals" class="admin-table">
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>User</th>
            <td mat-cell *matCellDef="let w">{{ w.user?.phone || w.user?.fullName || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Amount</th>
            <td mat-cell *matCellDef="let w" class="cell-amount">₦{{ w.amount | number }}</td>
          </ng-container>
          <ng-container matColumnDef="fee">
            <th mat-header-cell *matHeaderCellDef>Fee</th>
            <td mat-cell *matCellDef="let w">₦{{ w.fee | number }}</td>
          </ng-container>
          <ng-container matColumnDef="bank">
            <th mat-header-cell *matHeaderCellDef>Bank</th>
            <td mat-cell *matCellDef="let w">{{ w.metadata?.bankName || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="account">
            <th mat-header-cell *matHeaderCellDef>Account</th>
            <td mat-cell *matCellDef="let w">{{ w.metadata?.accountNumber || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let w">
              <span class="chip" [style.background]="statusColor(w.status) + '33'" [style.color]="statusColor(w.status)">
                {{ w.status }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let w">{{ w.createdAt | date:'MMM d, y HH:mm' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let w">
              <button mat-icon-button (click)="toggleDetail(w)" matTooltip="View details">
                <mat-icon>{{ detailId === w._id ? 'expand_less' : 'expand_more' }}</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;" class="clickable-row" (click)="toggleDetail(row)"></tr>
        </table>

        <div class="paginator" *ngIf="totalPages > 1">
          <button mat-button [disabled]="page <= 1" (click)="goTo(page - 1)">Previous</button>
          <span class="page-info">Page {{ page }} of {{ totalPages }}</span>
          <button mat-button [disabled]="page >= totalPages" (click)="goTo(page + 1)">Next</button>
        </div>

        <div class="empty-state" *ngIf="!loading && withdrawals.length === 0">
          No withdrawals found
        </div>
      </mat-card>

      <div class="detail-panel" *ngIf="detail">
        <div class="detail-header">
          <h3>Withdrawal Details</h3>
          <div class="detail-actions">
            <button mat-stroked-button class="btn-approve" *ngIf="detail.status === 'pending'" (click)="approve(detail)" [disabled]="actionLoading">
              <mat-icon>check_circle</mat-icon> Approve & Process
            </button>
            <button mat-stroked-button class="btn-reject" *ngIf="detail.status === 'pending'" (click)="showReject = true" [disabled]="actionLoading">
              <mat-icon>cancel</mat-icon> Reject
            </button>
            <button mat-icon-button (click)="detail = null; detailId = null"><mat-icon>close</mat-icon></button>
          </div>
        </div>
        <div class="detail-grid">
          <div class="detail-item"><span class="d-label">Reference</span><span class="d-value">{{ detail.reference }}</span></div>
          <div class="detail-item"><span class="d-label">User</span><span class="d-value">{{ detail.user?.phone || '—' }} {{ detail.user?.fullName ? '(' + (detail.user?.fullName || '') + ')' : '' }}</span></div>
          <div class="detail-item"><span class="d-label">Amount</span><span class="d-value">₦{{ detail.amount | number }}</span></div>
          <div class="detail-item"><span class="d-label">Fee</span><span class="d-value">₦{{ detail.fee | number }}</span></div>
          <div class="detail-item"><span class="d-label">Net</span><span class="d-value">₦{{ (detail.amount - detail.fee) | number }}</span></div>
          <div class="detail-item"><span class="d-label">Bank</span><span class="d-value">{{ detail.metadata?.bankName || '—' }}</span></div>
          <div class="detail-item"><span class="d-label">Account Name</span><span class="d-value">{{ detail.metadata?.accountName || '—' }}</span></div>
          <div class="detail-item"><span class="d-label">Account Number</span><span class="d-value">{{ detail.metadata?.accountNumber || '—' }}</span></div>
          <div class="detail-item"><span class="d-label">Status</span><span class="d-value"><span class="chip" [style.background]="statusColor(detail.status) + '33'" [style.color]="statusColor(detail.status)">{{ detail.status }}</span></span></div>
          <div class="detail-item"><span class="d-label">Created</span><span class="d-value">{{ detail.createdAt | date:'MMM d, y HH:mm:ss' }}</span></div>
          <div class="detail-item"><span class="d-label">Completed</span><span class="d-value">{{ detail.completedAt ? (detail.completedAt | date:'MMM d, y HH:mm:ss') : '—' }}</span></div>
          <div class="detail-item" *ngIf="detail.failureReason"><span class="d-label">Failure Reason</span><span class="d-value" style="color:#f44336">{{ detail.failureReason }}</span></div>
        </div>

        <div class="reject-form" *ngIf="showReject">
          <mat-form-field appearance="outline" class="reject-input">
            <mat-label>Rejection reason</mat-label>
            <input matInput [(ngModel)]="rejectReason" placeholder="Enter reason for rejection">
          </mat-form-field>
          <div class="reject-actions">
            <button mat-stroked-button class="btn-cancel" (click)="showReject = false">Cancel</button>
            <button mat-stroked-button class="btn-reject" (click)="reject(detail)" [disabled]="!rejectReason.trim()">
              Confirm Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1400px; }
    .page-header { display: flex; align-items: baseline; gap: 16px; margin-bottom: 24px; }
    .page-header h1 { color: #fff; font-size: 24px; font-weight: 600; margin: 0; }
    .header-count { color: rgba(255,255,255,0.3); font-size: 13px; }
    .filter-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 16px; padding: 8px 16px; }
    .filter-row { display: flex; align-items: center; gap: 12px; }
    .filter-select { width: 200px; }
    .filter-spacer { flex: 1; }
    .btn-refresh { color: #90CAF9 !important; border-color: #90CAF9 !important; font-size: 12px !important; }
    .table-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); position: relative; min-height: 200px; }
    .loading-overlay { position: absolute; inset: 0; background: rgba(13,26,48,0.7); display: flex; align-items: center; justify-content: center; z-index: 10; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(0,230,118,0.2); border-top-color: #00E676; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .admin-table { width: 100%; }
    ::ng-deep .admin-table .mat-mdc-header-cell { color: rgba(255,255,255,0.5) !important; font-size: 11px !important; font-weight: 600 !important; text-transform: uppercase !important; border-bottom-color: rgba(255,255,255,0.08) !important; background: transparent !important; }
    ::ng-deep .admin-table .mat-mdc-cell { color: rgba(255,255,255,0.8) !important; font-size: 13px !important; border-bottom-color: rgba(255,255,255,0.05) !important; background: transparent !important; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: rgba(255,255,255,0.03) !important; }
    .cell-amount { color: #f44336 !important; font-weight: 700 !important; }
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
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    ::ng-deep .mat-mdc-select-value-text { color: #fff !important; }
    ::ng-deep .mat-mdc-select-arrow { color: rgba(255,255,255,0.3) !important; }
    ::ng-deep .mat-mdc-text-field-wrapper { background: rgba(255,255,255,0.04) !important; border-radius: 8px !important; }
    ::ng-deep .mdc-floating-label { color: rgba(255,255,255,0.3) !important; font-size: 12px !important; }
    ::ng-deep .mdc-line-ripple { display: none; }
    ::ng-deep input.mat-mdc-input-element { color: #fff !important; }
  `]
})
export class WithdrawMgtComponent implements OnInit {
  private admin = inject(AdminService);
  withdrawals: AdminWithdrawal[] = [];
  loading = false;
  actionLoading = false;
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;
  statusFilter = '';
  detail: AdminWithdrawal | null = null;
  detailId: string | null = null;
  showReject = false;
  rejectReason = '';
  columns = ['user', 'amount', 'fee', 'bank', 'account', 'status', 'date', 'actions'];

  ngOnInit() {
    this.loadWithdrawals();
  }

  loadWithdrawals() {
    this.loading = true;
    this.detail = null;
    this.detailId = null;
    this.admin.getWithdrawals({ page: this.page, limit: this.limit, status: this.statusFilter || undefined }).subscribe(res => {
      if (res.success) {
        this.withdrawals = res.data.items;
        this.total = res.data.total;
        this.page = res.data.page;
        this.totalPages = res.data.totalPages;
      }
      this.loading = false;
    });
  }

  onFilterChange() {
    this.page = 1;
    this.loadWithdrawals();
  }

  goTo(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadWithdrawals();
  }

  toggleDetail(w: AdminWithdrawal) {
    if (this.detailId === w._id) {
      this.detail = null;
      this.detailId = null;
      this.showReject = false;
    } else {
      this.detail = w;
      this.detailId = w._id;
      this.showReject = false;
      this.rejectReason = '';
    }
  }

  approve(w: AdminWithdrawal) {
    this.actionLoading = true;
    this.admin.approveWithdrawal(w._id).subscribe(res => {
      this.actionLoading = false;
      if (res.success) {
        this.loadWithdrawals();
      }
    });
  }

  reject(w: AdminWithdrawal) {
    if (!this.rejectReason.trim()) return;
    this.actionLoading = true;
    this.admin.rejectWithdrawal(w._id, this.rejectReason).subscribe(res => {
      this.actionLoading = false;
      if (res.success) {
        this.showReject = false;
        this.loadWithdrawals();
      }
    });
  }

  statusColor(s: string): string {
    return s === 'completed' ? '#00E676' : s === 'pending' ? '#E8B923' : s === 'processing' ? '#90CAF9' : s === 'failed' ? '#f44336' : s === 'cancelled' ? '#666' : '#555';
  }
}
