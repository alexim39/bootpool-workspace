import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminLoan } from '../services/admin.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-loan-mgt',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, FormsModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatTooltipModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Loan Management</h1>
        <span class="header-count">{{ total }} loans</span>
        <div class="header-spacer"></div>
        <button mat-stroked-button class="btn-create" (click)="showCreate = true">
          <mat-icon>add</mat-icon> New Loan
        </button>
      </div>

      <mat-card class="filter-card">
        <div class="filter-row">
          <mat-form-field appearance="outline" class="filter-select">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="onFilterChange()">
              <mat-option value="">All</mat-option>
              <mat-option value="pending">Pending</mat-option>
              <mat-option value="approved">Approved</mat-option>
              <mat-option value="active">Active</mat-option>
              <mat-option value="repaid">Repaid</mat-option>
              <mat-option value="defaulted">Defaulted</mat-option>
              <mat-option value="rejected">Rejected</mat-option>
            </mat-select>
          </mat-form-field>
          <div class="filter-spacer"></div>
          <button mat-stroked-button class="btn-refresh" (click)="loadLoans()">
            <mat-icon>refresh</mat-icon> Refresh
          </button>
        </div>
      </mat-card>

      <mat-card class="table-card">
        <div class="loading-overlay" *ngIf="loading">
          <div class="spinner"></div>
        </div>
        <table mat-table [dataSource]="loans" class="admin-table">
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>User</th>
            <td mat-cell *matCellDef="let l">{{ l.user?.phone || l.user?.fullName || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Amount</th>
            <td mat-cell *matCellDef="let l" class="cell-amount">₦{{ l.amount | number }}</td>
          </ng-container>
          <ng-container matColumnDef="purpose">
            <th mat-header-cell *matHeaderCellDef>Purpose</th>
            <td mat-cell *matCellDef="let l" class="cell-purpose">{{ l.purpose }}</td>
          </ng-container>
          <ng-container matColumnDef="interest">
            <th mat-header-cell *matHeaderCellDef>Interest</th>
            <td mat-cell *matCellDef="let l">{{ l.interestRate }}%</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let l">
              <span class="chip" [style.background]="statusColor(l.status) + '33'" [style.color]="statusColor(l.status)">
                {{ l.status }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Requested</th>
            <td mat-cell *matCellDef="let l">{{ l.requestedAt | date:'MMM d, y' }}</td>
          </ng-container>
          <ng-container matColumnDef="due">
            <th mat-header-cell *matHeaderCellDef>Due</th>
            <td mat-cell *matCellDef="let l">{{ l.dueDate ? (l.dueDate | date:'MMM d, y') : '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let l">
              <button mat-icon-button (click)="toggleDetail(l)" matTooltip="View details">
                <mat-icon>{{ detailId === l._id ? 'expand_less' : 'expand_more' }}</mat-icon>
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

        <div class="empty-state" *ngIf="!loading && loans.length === 0">
          No loans found
        </div>
      </mat-card>

      <div class="detail-panel" *ngIf="detail">
        <div class="detail-header">
          <h3>Loan Details</h3>
          <div class="detail-actions">
            <button mat-stroked-button class="btn-approve" *ngIf="detail.status === 'pending'" (click)="approve(detail)" [disabled]="actionLoading">
              <mat-icon>check_circle</mat-icon> Approve &amp; Credit
            </button>
            <button mat-stroked-button class="btn-reject" *ngIf="detail.status === 'pending'" (click)="showReject = true" [disabled]="actionLoading">
              <mat-icon>cancel</mat-icon> Reject
            </button>
            <button mat-stroked-button class="btn-repay" *ngIf="detail.status === 'approved' || detail.status === 'active'" (click)="repay(detail)" [disabled]="actionLoading">
              <mat-icon>payments</mat-icon> Mark Repaid
            </button>
            <button mat-icon-button (click)="detail = null; detailId = null"><mat-icon>close</mat-icon></button>
          </div>
        </div>
        <div class="detail-grid">
          <div class="detail-item"><span class="d-label">User</span><span class="d-value">{{ detail.user?.fullName || '—' }} ({{ detail.user?.phone || '—' }})</span></div>
          <div class="detail-item"><span class="d-label">Amount</span><span class="d-value">₦{{ detail.amount | number }}</span></div>
          <div class="detail-item"><span class="d-label">Interest Rate</span><span class="d-value">{{ detail.interestRate }}%</span></div>
          <div class="detail-item"><span class="d-label">Repayment Amount</span><span class="d-value">{{ detail.repaymentAmount ? ('₦' + (detail.repaymentAmount | number)) : '—' }}</span></div>
          <div class="detail-item"><span class="d-label">Purpose</span><span class="d-value">{{ detail.purpose }}</span></div>
          <div class="detail-item"><span class="d-label">Status</span><span class="d-value"><span class="chip" [style.background]="statusColor(detail.status) + '33'" [style.color]="statusColor(detail.status)">{{ detail.status }}</span></span></div>
          <div class="detail-item"><span class="d-label">Requested</span><span class="d-value">{{ detail.requestedAt | date:'MMM d, y HH:mm' }}</span></div>
          <div class="detail-item"><span class="d-label">Approved</span><span class="d-value">{{ detail.approvedAt ? (detail.approvedAt | date:'MMM d, y HH:mm') : '—' }}</span></div>
          <div class="detail-item"><span class="d-label">Approved By</span><span class="d-value">{{ detail.approvedBy?.fullName || detail.approvedBy?.phone || '—' }}</span></div>
          <div class="detail-item"><span class="d-label">Due Date</span><span class="d-value">{{ detail.dueDate ? (detail.dueDate | date:'MMM d, y') : '—' }}</span></div>
          <div class="detail-item"><span class="d-label">Repaid</span><span class="d-value">{{ detail.repaidAt ? (detail.repaidAt | date:'MMM d, y HH:mm') : '—' }}</span></div>
          <div class="detail-item" *ngIf="detail.note"><span class="d-label">Note</span><span class="d-value">{{ detail.note }}</span></div>
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

      <div class="create-panel" *ngIf="showCreate">
        <div class="detail-header">
          <h3>Create New Loan</h3>
          <button mat-icon-button (click)="showCreate = false"><mat-icon>close</mat-icon></button>
        </div>
        <div class="create-form">
          <mat-form-field appearance="outline" class="create-input">
            <mat-label>User ID</mat-label>
            <input matInput [(ngModel)]="newLoan.userId" placeholder="MongoDB User ID">
          </mat-form-field>
          <mat-form-field appearance="outline" class="create-input">
            <mat-label>Amount (NGN)</mat-label>
            <input matInput type="number" [(ngModel)]="newLoan.amount" placeholder="1000" min="100">
          </mat-form-field>
          <mat-form-field appearance="outline" class="create-input">
            <mat-label>Purpose</mat-label>
            <input matInput [(ngModel)]="newLoan.purpose" placeholder="e.g. Business capital">
          </mat-form-field>
          <div class="create-row">
            <mat-form-field appearance="outline" class="create-input-sm">
              <mat-label>Interest Rate (%)</mat-label>
              <input matInput type="number" [(ngModel)]="newLoan.interestRate" placeholder="0">
            </mat-form-field>
            <mat-form-field appearance="outline" class="create-input-sm">
              <mat-label>Due Date</mat-label>
              <input matInput type="date" [(ngModel)]="newLoan.dueDate">
            </mat-form-field>
          </div>
          <div class="create-actions">
            <button mat-stroked-button class="btn-cancel" (click)="showCreate = false">Cancel</button>
            <button mat-stroked-button class="btn-approve" (click)="createLoan()" [disabled]="!newLoan.userId || !newLoan.amount || !newLoan.purpose">
              <mat-icon>add</mat-icon> Create Loan
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1400px; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .page-header h1 { color: #fff; font-size: 24px; font-weight: 600; margin: 0; }
    .header-count { color: rgba(255,255,255,0.3); font-size: 13px; }
    .header-spacer { flex: 1; }
    .btn-create { color: #CE93D8 !important; border-color: #CE93D8 !important; font-size: 12px !important; }
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
    .cell-amount { font-weight: 700 !important; }
    .cell-purpose { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .chip { padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #fff; text-transform: capitalize; }
    .paginator { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
    .page-info { color: rgba(255,255,255,0.3); font-size: 12px; }
    .empty-state { padding: 48px 24px; text-align: center; color: rgba(255,255,255,0.3); font-size: 13px; }
    .detail-panel, .create-panel { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 16px; padding: 20px; }
    .detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
    .detail-header h3 { color: #fff; font-size: 16px; font-weight: 600; margin: 0; }
    .detail-actions { display: flex; align-items: center; gap: 8px; }
    .btn-approve { color: #00E676 !important; border-color: #00E676 !important; font-size: 12px !important; }
    .btn-reject { color: #f44336 !important; border-color: #f44336 !important; font-size: 12px !important; }
    .btn-repay { color: #E8B923 !important; border-color: #E8B923 !important; font-size: 12px !important; }
    .btn-cancel { color: rgba(255,255,255,0.5) !important; border-color: rgba(255,255,255,0.2) !important; font-size: 12px !important; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .d-label { color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .d-value { color: #fff; font-size: 14px; font-weight: 500; }
    .reject-form { margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 12px; }
    .reject-input { width: 100%; }
    .reject-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .create-form { display: flex; flex-direction: column; gap: 16px; }
    .create-input { width: 100%; }
    .create-row { display: flex; gap: 16px; }
    .create-input-sm { flex: 1; }
    .create-actions { display: flex; gap: 8px; justify-content: flex-end; }
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    ::ng-deep .mat-mdc-select-value-text { color: #fff !important; }
    ::ng-deep .mat-mdc-select-arrow { color: rgba(255,255,255,0.3) !important; }
    ::ng-deep .mat-mdc-text-field-wrapper { background: rgba(255,255,255,0.04) !important; border-radius: 8px !important; }
    ::ng-deep .mdc-floating-label { color: rgba(255,255,255,0.3) !important; font-size: 12px !important; }
    ::ng-deep .mdc-line-ripple { display: none; }
    ::ng-deep input.mat-mdc-input-element { color: #fff !important; }
  `]
})
export class LoanMgtComponent implements OnInit {
  private admin = inject(AdminService);
  loans: AdminLoan[] = [];
  loading = false;
  actionLoading = false;
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;
  statusFilter = '';
  detail: AdminLoan | null = null;
  detailId: string | null = null;
  showReject = false;
  rejectReason = '';
  showCreate = false;
  newLoan = { userId: '', amount: 0, purpose: '', interestRate: 0, dueDate: '' };
  columns = ['user', 'amount', 'purpose', 'interest', 'status', 'date', 'due', 'actions'];

  ngOnInit() {
    this.loadLoans();
  }

  loadLoans() {
    this.loading = true;
    this.detail = null;
    this.detailId = null;
    this.admin.getLoans({ page: this.page, limit: this.limit, status: this.statusFilter || undefined }).subscribe(res => {
      if (res.success) {
        this.loans = res.data.items;
        this.total = res.data.total;
        this.page = res.data.page;
        this.totalPages = res.data.totalPages;
      }
      this.loading = false;
    });
  }

  onFilterChange() {
    this.page = 1;
    this.loadLoans();
  }

  goTo(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadLoans();
  }

  toggleDetail(l: AdminLoan) {
    if (this.detailId === l._id) {
      this.detail = null;
      this.detailId = null;
      this.showReject = false;
    } else {
      this.detail = l;
      this.detailId = l._id;
      this.showReject = false;
      this.rejectReason = '';
    }
  }

  approve(l: AdminLoan) {
    this.actionLoading = true;
    this.admin.approveLoan(l._id).subscribe(res => {
      this.actionLoading = false;
      if (res.success) {
        this.loadLoans();
      }
    });
  }

  reject(l: AdminLoan) {
    if (!this.rejectReason.trim()) return;
    this.actionLoading = true;
    this.admin.rejectLoan(l._id, this.rejectReason).subscribe(res => {
      this.actionLoading = false;
      if (res.success) {
        this.showReject = false;
        this.loadLoans();
      }
    });
  }

  repay(l: AdminLoan) {
    this.actionLoading = true;
    this.admin.repayLoan(l._id).subscribe(res => {
      this.actionLoading = false;
      if (res.success) {
        this.loadLoans();
      }
    });
  }

  createLoan() {
    if (!this.newLoan.userId || !this.newLoan.amount || !this.newLoan.purpose) return;
    this.actionLoading = true;
    this.admin.createLoan({
      userId: this.newLoan.userId,
      amount: this.newLoan.amount,
      purpose: this.newLoan.purpose,
      interestRate: this.newLoan.interestRate || undefined,
      dueDate: this.newLoan.dueDate || undefined
    }).subscribe(res => {
      this.actionLoading = false;
      if (res.success) {
        this.showCreate = false;
        this.newLoan = { userId: '', amount: 0, purpose: '', interestRate: 0, dueDate: '' };
        this.loadLoans();
      }
    });
  }

  statusColor(s: string): string {
    return s === 'repaid' ? '#00E676' : s === 'approved' ? '#90CAF9' : s === 'active' ? '#CE93D8' : s === 'pending' ? '#E8B923' : s === 'rejected' ? '#666' : s === 'defaulted' ? '#f44336' : '#555';
  }
}
