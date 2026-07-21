import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { AdminService, AdminWithdrawal } from '../services/admin.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-withdrawals',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, SlicePipe, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatPaginatorModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Withdrawals</h1>
      </div>

      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="fill" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="onFilterChange()">
              <mat-option value="">All</mat-option>
              <mat-option value="pending">Pending</mat-option>
              <mat-option value="processing">Processing</mat-option>
              <mat-option value="completed">Completed</mat-option>
              <mat-option value="failed">Failed</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <div class="detail-panel" *ngIf="selectedWdr as w">
        <div class="panel-header">
          <h3>Withdrawal Details</h3>
          <button mat-icon-button (click)="selectedWdr = null"><mat-icon>close</mat-icon></button>
        </div>
        <div class="panel-body">
          <div class="detail-grid">
            <div class="detail-item"><span class="label">Reference</span><span class="value">{{ w.reference }}</span></div>
            <div class="detail-item"><span class="label">User</span><span class="value">{{ w.user?.phone || w.user?.fullName || w.userId }}</span></div>
            <div class="detail-item"><span class="label">Amount</span><span class="value">\u20A6{{ w.amount | number }}</span></div>
            <div class="detail-item"><span class="label">Fee</span><span class="value">\u20A6{{ w.fee | number }}</span></div>
            <div class="detail-item"><span class="label">Status</span><span class="value"><span class="chip" [style.background]="statusColor(w.status)">{{ w.status }}</span></span></div>
            <div class="detail-item"><span class="label">Bank</span><span class="value">{{ w.metadata?.accountName || '-' }} / {{ w.metadata?.accountNumber || '-' }}</span></div>
            <div class="detail-item"><span class="label">Created</span><span class="value">{{ w.createdAt | date:'medium' }}</span></div>
            <div class="detail-item" *ngIf="w.failureReason"><span class="label">Reason</span><span class="value" style="color:#f44336">{{ w.failureReason }}</span></div>
          </div>
          <div class="action-buttons" *ngIf="w.status === 'processing'">
            <button mat-raised-button class="action-approve" (click)="approve(w)">
              <mat-icon>check_circle</mat-icon> Approve
            </button>
            <button mat-stroked-button class="action-reject" (click)="rejectTarget = w">
              <mat-icon>cancel</mat-icon> Reject
            </button>
          </div>
        </div>
      </div>

      <div class="reject-form" *ngIf="rejectTarget">
        <div class="reject-content">
          <h3>Reject Withdrawal</h3>
          <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0 0 12px">
            Rejecting withdrawal for {{ rejectTarget.user?.phone || rejectTarget.userId }} &mdash; \u20A6{{ rejectTarget.amount | number }}
          </p>
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Reason for rejection</mat-label>
            <textarea matInput [(ngModel)]="rejectReason" rows="2" placeholder="e.g. Suspicious activity, bank details mismatch"></textarea>
          </mat-form-field>
          <div class="reject-actions">
            <button mat-button (click)="rejectTarget = null; rejectReason = ''">Cancel</button>
            <button mat-raised-button color="warn" (click)="reject(rejectTarget)" [disabled]="!rejectReason.trim()">Reject &amp; Refund</button>
          </div>
        </div>
      </div>

      <mat-card class="table-card">
        <div class="loading-shim" *ngIf="loading">
          <div class="spinner"></div>
        </div>
        <table mat-table [dataSource]="items" class="admin-table">
          <ng-container matColumnDef="reference">
            <th mat-header-cell *matHeaderCellDef>Reference</th>
            <td mat-cell *matCellDef="let w" class="clickable" (click)="selectWdr(w)">{{ w.reference | slice:0:14 }}...</td>
          </ng-container>
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>User</th>
            <td mat-cell *matCellDef="let w" class="clickable" (click)="selectWdr(w)">{{ w.user?.phone || w.user?.fullName || w.userId | slice:0:10 }}</td>
          </ng-container>
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Amount</th>
            <td mat-cell *matCellDef="let w" class="clickable" (click)="selectWdr(w)">\u20A6{{ w.amount | number }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let w">
              <span class="chip" [style.background]="statusColor(w.status)">{{ w.status }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let w" class="clickable" (click)="selectWdr(w)">{{ w.createdAt | date:'short' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let w">
              <button mat-icon-button (click)="selectWdr(w)" matTooltip="View"><mat-icon>visibility</mat-icon></button>
              <button mat-icon-button *ngIf="w.status === 'processing'" (click)="approve(w)" matTooltip="Approve" style="color:#00E676"><mat-icon>check_circle</mat-icon></button>
              <button mat-icon-button *ngIf="w.status === 'processing'" (click)="rejectTarget = w" matTooltip="Reject" style="color:#f44336"><mat-icon>cancel</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
        <div class="empty-state" *ngIf="!loading && items.length === 0">No withdrawals found</div>
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
  `,
  styles: [`
    .page { max-width: 1400px; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { color: #fff; font-size: 24px; font-weight: 600; margin: 0; }
    .filter-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 16px; padding: 8px 16px; }
    .filters { display: flex; gap: 16px; align-items: center; }
    .filter-field { width: 200px; }
    .table-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); position: relative; }
    .admin-table { width: 100%; }
    ::ng-deep .admin-table .mat-mdc-header-cell { color: rgba(255,255,255,0.5) !important; font-size: 12px !important; font-weight: 600 !important; text-transform: uppercase !important; border-bottom-color: rgba(255,255,255,0.08) !important; }
    ::ng-deep .admin-table .mat-mdc-cell { color: rgba(255,255,255,0.8) !important; font-size: 13px !important; border-bottom-color: rgba(255,255,255,0.05) !important; }
    ::ng-deep .mat-mdc-paginator { background: transparent !important; color: rgba(255,255,255,0.7) !important; border-top: 1px solid rgba(255,255,255,0.06); }
    ::ng-deep .mat-mdc-paginator .mat-mdc-paginator-navigation-button { color: rgba(255,255,255,0.6) !important; }
    ::ng-deep .mat-mdc-paginator .mat-mdc-select-value-text { color: rgba(255,255,255,0.7) !important; }
    .clickable { cursor: pointer; }
    .clickable:hover { color: #00E676; }
    .chip { padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #fff; text-transform: capitalize; }
    .empty-state { padding: 32px; text-align: center; color: rgba(255,255,255,0.3); font-size: 14px; }
    .loading-shim { position: absolute; inset: 0; background: rgba(10,20,40,0.6); z-index: 10; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(0,230,118,0.2); border-top-color: #00E676; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .detail-panel { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 16px; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .panel-header h3 { color: #fff; font-size: 16px; font-weight: 600; margin: 0; }
    .panel-header button { color: rgba(255,255,255,0.5); }
    .panel-body { padding: 16px 20px; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .detail-item .label { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; font-weight: 600; }
    .detail-item .value { font-size: 14px; color: #fff; font-weight: 500; }
    .action-buttons { display: flex; gap: 12px; margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
    .action-approve { background: #00E676 !important; color: #0A1428 !important; font-weight: 600; }
    .action-reject { color: #f44336 !important; border-color: #f44336 !important; }
    .reject-form { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(244,67,54,0.3); margin-bottom: 16px; }
    .reject-content { padding: 20px; }
    .reject-content h3 { color: #f44336; font-size: 16px; font-weight: 600; margin: 0 0 8px; }
    .reject-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }
    .full-width { width: 100%; }
  `]
})
export class WithdrawalsComponent implements OnInit, OnDestroy {
  items: AdminWithdrawal[] = [];
  total = 0;
  page = 1;
  limit = 20;
  totalPages = 0;
  statusFilter = '';
  selectedWdr: AdminWithdrawal | null = null;
  rejectTarget: AdminWithdrawal | null = null;
  rejectReason = '';
  loading = false;
  columns = ['reference', 'user', 'amount', 'status', 'date', 'actions'];
  private destroy$ = new Subject<void>();

  constructor(private admin: AdminService) {}

  ngOnInit() { this.loadItems(); }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadItems() {
    this.loading = true;
    this.admin.getWithdrawals({ page: this.page, limit: this.limit, status: this.statusFilter || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res.success) {
          this.items = res.data.items;
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
    this.loadItems();
  }

  onPageChange(e: PageEvent) {
    this.page = e.pageIndex + 1;
    this.limit = e.pageSize;
    this.loadItems();
  }

  selectWdr(w: AdminWithdrawal) {
    this.admin.getWithdrawal(w._id || w.id).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) this.selectedWdr = res.data;
    });
  }

  statusColor(s: string): string {
    const map: Record<string, string> = { pending: '#E8B923', processing: '#2196f3', completed: '#00E676', failed: '#f44336' };
    return map[s] || '#555';
  }

  approve(w: AdminWithdrawal) {
    this.admin.approveWithdrawal(w._id || w.id).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.selectedWdr = null;
      this.loadItems();
    });
  }

  reject(w: AdminWithdrawal) {
    if (!this.rejectReason.trim()) return;
    this.admin.rejectWithdrawal(w._id || w.id, this.rejectReason).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.rejectTarget = null;
      this.rejectReason = '';
      this.selectedWdr = null;
      this.loadItems();
    });
  }
}
