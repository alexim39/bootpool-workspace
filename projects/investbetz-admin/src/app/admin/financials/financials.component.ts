import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminWithdrawal, AdminTransaction, DashboardStats } from '../services/admin.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-financials',
  standalone: true,
  imports: [
    NgIf, NgFor, DatePipe, DecimalPipe, SlicePipe, FormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatTooltipModule
  ],
  template: `
    <div class="fin-page">
      <div class="page-header">
        <h1>Financials</h1>
        <div class="header-actions">
          <button mat-stroked-button class="btn-adjust" (click)="showAdjustModal = true">
            <mat-icon>account_balance_wallet</mat-icon> Adjust Wallet
          </button>
          <button mat-stroked-button class="btn-refresh" (click)="refreshAll()">
            <mat-icon>refresh</mat-icon> Refresh
          </button>
        </div>
      </div>

      <div class="summary-grid">
        <mat-card class="summary-card card-volume">
          <mat-icon class="sum-icon">trending_up</mat-icon>
          <div class="sum-info">
            <span class="sum-label">Total Stake Volume</span>
            <span class="sum-value">\u20A6{{ dashData.totalVolume | number }}</span>
          </div>
        </mat-card>
        <mat-card class="summary-card card-payout">
          <mat-icon class="sum-icon">payments</mat-icon>
          <div class="sum-info">
            <span class="sum-label">Total Payouts</span>
            <span class="sum-value">\u20A6{{ dashData.totalPayouts | number }}</span>
          </div>
        </mat-card>
        <mat-card class="summary-card card-deposits">
          <mat-icon class="sum-icon">savings</mat-icon>
          <div class="sum-info">
            <span class="sum-label">Total Deposits</span>
            <span class="sum-value">\u20A6{{ totals.deposits | number }}</span>
          </div>
        </mat-card>
        <mat-card class="summary-card card-withdrawals">
          <mat-icon class="sum-icon">money_off</mat-icon>
          <div class="sum-info">
            <span class="sum-label">Total Withdrawals</span>
            <span class="sum-value">\u20A6{{ totals.withdrawals | number }}</span>
          </div>
        </mat-card>
        <mat-card class="summary-card card-pending">
          <mat-icon class="sum-icon">hourglass_top</mat-icon>
          <div class="sum-info">
            <span class="sum-label">Pending Withdrawals</span>
            <span class="sum-value">\u20A6{{ totals.pendingAmount | number }}</span>
            <span class="sum-sub">({{ totals.pendingCount }} requests)</span>
          </div>
        </mat-card>
        <mat-card class="summary-card card-revenue">
          <mat-icon class="sum-icon">account_balance</mat-icon>
          <div class="sum-info">
            <span class="sum-label">Platform Revenue</span>
            <span class="sum-value">\u20A6{{ totals.revenue | number }}</span>
          </div>
        </mat-card>
      </div>

      <div class="tab-bar">
        <button class="tab-btn" [class.active]="activeTab === 'overview'" (click)="activeTab = 'overview'">Overview</button>
        <button class="tab-btn" [class.active]="activeTab === 'withdrawals'" (click)="activeTab = 'withdrawals'">
          Withdrawals
          <span class="tab-badge" *ngIf="totals.pendingCount > 0">{{ totals.pendingCount }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'transactions'" (click)="activeTab = 'transactions'">Transactions</button>
      </div>

      <div *ngIf="activeTab === 'overview'">
        <div class="volume-section">
          <h3 class="section-title">Daily Stake Volume (7 days)</h3>
          <div class="bar-chart" *ngIf="dashData.dailyVolume?.length">
            <div class="bar-item" *ngFor="let d of dashData.dailyVolume">
              <div class="bar-track">
                <div class="bar-fill" [style.height.%]="barHeight(d.volume)"></div>
              </div>
              <span class="bar-value">\u20A6{{ d.volume | number: '1.0a' }}</span>
              <span class="bar-label">{{ d.date | slice:5:10 }}</span>
            </div>
          </div>
          <div class="empty-state" *ngIf="!dashData.dailyVolume?.length">No volume data yet</div>
        </div>

        <mat-card class="section-card">
          <h3 class="section-title">Recent Activity</h3>
          <div class="loading-shim" *ngIf="loading">
            <div class="spinner"></div>
          </div>
          <table mat-table [dataSource]="recentItems" class="admin-table">
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let r">
                <span class="chip" [style.background]="typeColor(r.type) + '33'" [style.color]="typeColor(r.type)">{{ r.type }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="user">
              <th mat-header-cell *matHeaderCellDef>User</th>
              <td mat-cell *matCellDef="let r">{{ r.user?.phone || r.userId | slice:0:12 }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let r" [style.color]="r.type === 'withdrawal' ? '#f44336' : '#00E676'">\u20A6{{ r.amount | number }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let r">
                <span class="chip" [style.background]="statusColor(r.status) + '33'" [style.color]="statusColor(r.status)">{{ r.status }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let r">{{ r.createdAt | date:'MMM d, HH:mm' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['type','user','amount','status','date']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['type','user','amount','status','date']"></tr>
          </table>
          <div class="empty-state" *ngIf="!loading && recentItems.length === 0">No recent activity</div>
        </mat-card>
      </div>

      <div *ngIf="activeTab === 'withdrawals'">
        <mat-card class="filter-card">
          <div class="filter-row">
            <mat-form-field appearance="outline" class="filter-select">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="wdFilter.status" (selectionChange)="wdPage = 1; loadWithdrawals()">
                <mat-option value="">All</mat-option>
                <mat-option value="pending">Pending</mat-option>
                <mat-option value="processing">Processing</mat-option>
                <mat-option value="completed">Completed</mat-option>
                <mat-option value="failed">Failed</mat-option>
                <mat-option value="cancelled">Cancelled</mat-option>
              </mat-select>
            </mat-form-field>
            <span class="filter-count">{{ wdTotal }} withdrawals</span>
          </div>
        </mat-card>

        <mat-card class="table-card">
          <div class="loading-overlay" *ngIf="wdLoading">
            <div class="spinner"></div>
          </div>
          <table mat-table [dataSource]="withdrawals" class="admin-table">
            <ng-container matColumnDef="user">
              <th mat-header-cell *matHeaderCellDef>User</th>
              <td mat-cell *matCellDef="let w">{{ w.user?.phone || w.user?.fullName || '\u2014' }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let w" class="cell-amount">\u20A6{{ w.amount | number }}</td>
            </ng-container>
            <ng-container matColumnDef="account">
              <th mat-header-cell *matHeaderCellDef>Account</th>
              <td mat-cell *matCellDef="let w">{{ w.metadata?.accountName || '\u2014' }} / {{ w.metadata?.accountNumber || '\u2014' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let w">
                <span class="chip" [style.background]="statusColor(w.status) + '33'" [style.color]="statusColor(w.status)">{{ w.status }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let w">{{ w.createdAt | date:'MMM d, y HH:mm' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let w">
                <button mat-icon-button (click)="selectWithdrawal(w)" matTooltip="View & Approve">
                  <mat-icon>visibility</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="wdColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: wdColumns;"></tr>
          </table>
          <div class="paginator" *ngIf="wdTotalPages > 1">
            <button mat-button [disabled]="wdPage <= 1" (click)="wdPage = wdPage - 1; loadWithdrawals()">Previous</button>
            <span class="page-info">Page {{ wdPage }} of {{ wdTotalPages }}</span>
            <button mat-button [disabled]="wdPage >= wdTotalPages" (click)="wdPage = wdPage + 1; loadWithdrawals()">Next</button>
          </div>
          <div class="empty-state" *ngIf="!wdLoading && withdrawals.length === 0">No withdrawals found</div>
        </mat-card>

        <div class="detail-panel" *ngIf="selectedWd">
          <div class="detail-header">
            <h3>Withdrawal Details</h3>
            <div class="detail-actions">
              <button mat-stroked-button class="btn-approve" *ngIf="selectedWd.status === 'pending'" (click)="approveWithdrawal(selectedWd)" [disabled]="wdActionLoading">
                <mat-icon>check_circle</mat-icon> Approve & Process
              </button>
              <button mat-stroked-button class="btn-reject" *ngIf="selectedWd.status === 'pending'" (click)="showRejectForm = true" [disabled]="wdActionLoading">
                <mat-icon>cancel</mat-icon> Reject
              </button>
              <button mat-icon-button (click)="selectedWd = null"><mat-icon>close</mat-icon></button>
            </div>
          </div>
          <div class="detail-grid">
            <div class="detail-item"><span class="d-label">Reference</span><span class="d-value">{{ selectedWd.reference }}</span></div>
            <div class="detail-item"><span class="d-label">User</span><span class="d-value">{{ selectedWd.user?.phone || '\u2014' }} {{ selectedWd.user?.fullName ? '(' + selectedWd.user?.fullName + ')' : '' }}</span></div>
            <div class="detail-item"><span class="d-label">Amount</span><span class="d-value">\u20A6{{ selectedWd.amount | number }}</span></div>
            <div class="detail-item"><span class="d-label">Fee</span><span class="d-value">\u20A6{{ selectedWd.fee | number }}</span></div>
            <div class="detail-item"><span class="d-label">Net</span><span class="d-value">\u20A6{{ (selectedWd.amount - selectedWd.fee) | number }}</span></div>
            <div class="detail-item"><span class="d-label">Account Name</span><span class="d-value">{{ selectedWd.metadata?.accountName || '\u2014' }}</span></div>
            <div class="detail-item"><span class="d-label">Account Number</span><span class="d-value">{{ selectedWd.metadata?.accountNumber || '\u2014' }}</span></div>
            <div class="detail-item"><span class="d-label">Status</span><span class="d-value"><span class="chip" [style.background]="statusColor(selectedWd.status) + '33'" [style.color]="statusColor(selectedWd.status)">{{ selectedWd.status }}</span></span></div>
            <div class="detail-item"><span class="d-label">Created</span><span class="d-value">{{ selectedWd.createdAt | date:'MMM d, y HH:mm:ss' }}</span></div>
            <div class="detail-item"><span class="d-label">Completed</span><span class="d-value">{{ selectedWd.completedAt ? (selectedWd.completedAt | date:'MMM d, y HH:mm:ss') : '\u2014' }}</span></div>
            <div class="detail-item" *ngIf="selectedWd.failureReason"><span class="d-label">Failure Reason</span><span class="d-value" style="color:#f44336">{{ selectedWd.failureReason }}</span></div>
          </div>
          <div class="reject-form" *ngIf="showRejectForm">
            <mat-form-field appearance="outline" class="reject-input">
              <mat-label>Rejection reason</mat-label>
              <input matInput [(ngModel)]="rejectReason" placeholder="Enter reason for rejection">
            </mat-form-field>
            <div class="reject-actions">
              <button mat-stroked-button class="btn-cancel" (click)="showRejectForm = false; rejectReason = ''">Cancel</button>
              <button mat-stroked-button class="btn-reject" (click)="rejectWithdrawal(selectedWd)" [disabled]="!rejectReason.trim()">Confirm Reject</button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="activeTab === 'transactions'">
        <mat-card class="filter-card">
          <div class="filter-row">
            <mat-form-field appearance="outline" class="filter-select">
              <mat-label>Type</mat-label>
              <mat-select [(ngModel)]="txFilter.type" (selectionChange)="txPage = 1; loadTransactions()">
                <mat-option value="">All</mat-option>
                <mat-option value="deposit">Deposit</mat-option>
                <mat-option value="withdrawal">Withdrawal</mat-option>
                <mat-option value="stake">Stake</mat-option>
                <mat-option value="payout">Payout</mat-option>
                <mat-option value="refund">Refund</mat-option>
                <mat-option value="adjustment">Adjustment</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="filter-select">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="txFilter.status" (selectionChange)="txPage = 1; loadTransactions()">
                <mat-option value="">All</mat-option>
                <mat-option value="completed">Completed</mat-option>
                <mat-option value="pending">Pending</mat-option>
                <mat-option value="failed">Failed</mat-option>
                <mat-option value="cancelled">Cancelled</mat-option>
              </mat-select>
            </mat-form-field>
            <span class="filter-count">{{ txTotal }} transactions</span>
          </div>
        </mat-card>

        <mat-card class="table-card">
          <div class="loading-overlay" *ngIf="txLoading">
            <div class="spinner"></div>
          </div>
          <table mat-table [dataSource]="transactions" class="admin-table">
            <ng-container matColumnDef="reference">
              <th mat-header-cell *matHeaderCellDef>Reference</th>
              <td mat-cell *matCellDef="let t" class="cell-ref">{{ t.reference?.slice(0, 16) }}...</td>
            </ng-container>
            <ng-container matColumnDef="user">
              <th mat-header-cell *matHeaderCellDef>User</th>
              <td mat-cell *matCellDef="let t">{{ t.user?.phone || t.userId | slice:0:12 }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let t">
                <span class="chip" [style.background]="typeColor(t.type) + '33'" [style.color]="typeColor(t.type)">{{ t.type }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let t" [style.color]="isDebit(t.type) ? '#f44336' : '#00E676'" class="cell-amount">
                {{ isCredit(t.type) ? '+' : '-' }}\u20A6{{ t.amount | number }}
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let t">
                <span class="chip" [style.background]="txStatusColor(t.status) + '33'" [style.color]="txStatusColor(t.status)">{{ t.status }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let t">{{ t.createdAt | date:'MMM d, y HH:mm' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let t">
                <button mat-icon-button (click)="selectedTx = selectedTx === t ? null : t" matTooltip="View details">
                  <mat-icon>{{ selectedTx === t ? 'expand_less' : 'expand_more' }}</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="txColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: txColumns;"></tr>
          </table>
          <div class="paginator" *ngIf="txTotalPages > 1">
            <button mat-button [disabled]="txPage <= 1" (click)="txPage = txPage - 1; loadTransactions()">Previous</button>
            <span class="page-info">Page {{ txPage }} of {{ txTotalPages }}</span>
            <button mat-button [disabled]="txPage >= txTotalPages" (click)="txPage = txPage + 1; loadTransactions()">Next</button>
          </div>
          <div class="empty-state" *ngIf="!txLoading && transactions.length === 0">No transactions found</div>
        </mat-card>

        <div class="detail-panel" *ngIf="selectedTx">
          <div class="detail-header">
            <h3>Transaction Details</h3>
            <button mat-icon-button (click)="selectedTx = null"><mat-icon>close</mat-icon></button>
          </div>
          <div class="detail-grid">
            <div class="detail-item"><span class="d-label">Reference</span><span class="d-value">{{ selectedTx.reference }}</span></div>
            <div class="detail-item"><span class="d-label">User</span><span class="d-value">{{ selectedTx.user?.phone || selectedTx.userId }}</span></div>
            <div class="detail-item"><span class="d-label">Type</span><span class="d-value"><span class="chip" [style.background]="typeColor(selectedTx.type) + '33'" [style.color]="typeColor(selectedTx.type)">{{ selectedTx.type }}</span></span></div>
            <div class="detail-item"><span class="d-label">Amount</span><span class="d-value">\u20A6{{ selectedTx.amount | number }}</span></div>
            <div class="detail-item"><span class="d-label">Fee</span><span class="d-value">\u20A6{{ selectedTx.fee | number }}</span></div>
            <div class="detail-item"><span class="d-label">Net Amount</span><span class="d-value">\u20A6{{ (selectedTx.amount - selectedTx.fee) | number }}</span></div>
            <div class="detail-item"><span class="d-label">Status</span><span class="d-value"><span class="chip" [style.background]="txStatusColor(selectedTx.status) + '33'" [style.color]="txStatusColor(selectedTx.status)">{{ selectedTx.status }}</span></span></div>
            <div class="detail-item"><span class="d-label">Provider</span><span class="d-value">{{ selectedTx.provider || '\u2014' }}</span></div>
            <div class="detail-item"><span class="d-label">Created</span><span class="d-value">{{ selectedTx.createdAt | date:'MMM d, y HH:mm:ss' }}</span></div>
            <div class="detail-item"><span class="d-label">Completed</span><span class="d-value">{{ selectedTx.completedAt ? (selectedTx.completedAt | date:'MMM d, y HH:mm:ss') : '\u2014' }}</span></div>
            <div class="detail-item" *ngIf="selectedTx.metadata?.description"><span class="d-label">Description</span><span class="d-value">{{ selectedTx.metadata?.description }}</span></div>
            <div class="detail-item" *ngIf="selectedTx.failureReason"><span class="d-label">Failure Reason</span><span class="d-value" style="color:#f44336">{{ selectedTx.failureReason }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showAdjustModal" (click)="showAdjustModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Manual Wallet Adjustment</h2>
          <button mat-icon-button (click)="showAdjustModal = false"><mat-icon>close</mat-icon></button>
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
                <mat-option value="credit">Credit (+) </mat-option>
                <mat-option value="debit">Debit (-)</mat-option>
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
            <button mat-button (click)="showAdjustModal = false">Cancel</button>
            <button mat-raised-button class="btn-submit" (click)="submitAdjustment()" [disabled]="!adjustData.userId || !adjustData.amount || !adjustData.reason || adjustLoading">
              <mat-icon>check</mat-icon> {{ adjustLoading ? 'Processing...' : 'Submit' }}
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
export class FinancialsComponent implements OnInit, OnDestroy {
  private admin = inject(AdminService);
  private destroy$ = new Subject<void>();

  activeTab: 'overview' | 'withdrawals' | 'transactions' = 'overview';

  dashData: DashboardStats & { totalPayouts?: number; totalPods?: number; pendingSettlements?: number } = {
    totalUsers: 0, activePods: 0, totalStakes: 0, totalVolume: 0,
    totalPayouts: 0, pendingSettlements: 0, totalPods: 0,
    dailyVolume: [], recentStakes: [], podStatusBreakdown: []
  };
  loading = false;

  totals = { deposits: 0, withdrawals: 0, pendingCount: 0, pendingAmount: 0, revenue: 0 };

  withdrawals: AdminWithdrawal[] = [];
  wdLoading = false;
  wdPage = 1;
  wdLimit = 20;
  wdTotal = 0;
  wdTotalPages = 0;
  wdFilter = { status: '' };
  wdColumns = ['user', 'amount', 'account', 'status', 'date', 'actions'];
  selectedWd: AdminWithdrawal | null = null;
  wdActionLoading = false;
  showRejectForm = false;
  rejectReason = '';

  transactions: AdminTransaction[] = [];
  txLoading = false;
  txPage = 1;
  txLimit = 20;
  txTotal = 0;
  txTotalPages = 0;
  txFilter = { type: '', status: '' };
  txColumns = ['reference', 'user', 'type', 'amount', 'status', 'date', 'actions'];
  selectedTx: AdminTransaction | null = null;

  recentItems: AdminTransaction[] = [];

  showAdjustModal = false;
  adjustLoading = false;
  adjustData = { userId: '', amount: 0, type: 'credit' as 'credit' | 'debit', reason: '' };
  adjustResult: { success: boolean; message: string } | null = null;

  ngOnInit() {
    this.refreshAll();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshAll() {
    this.loadDashboard();
    this.loadWithdrawals();
    this.loadTransactions();
    this.loadRecent();
  }

  loadDashboard() {
    this.loading = true;
    this.admin.getDashboard().pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) {
        this.dashData = res.data;
        this.loading = false;
      }
    });
    this.admin.getTransactions({ page: 1, limit: 1, type: 'deposit', status: 'completed' }).pipe(takeUntil(this.destroy$)).subscribe();
    this.admin.getTransactions({ page: 1, limit: 1, type: 'withdrawal', status: 'completed' }).pipe(takeUntil(this.destroy$)).subscribe();
  }

  loadRecent() {
    this.admin.getTransactions({ page: 1, limit: 10 }).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) this.recentItems = res.data.items;
    });
  }

  loadWithdrawals() {
    this.wdLoading = true;
    this.selectedWd = null;
    this.showRejectForm = false;
    this.admin.getWithdrawals({ page: this.wdPage, limit: this.wdLimit, status: this.wdFilter.status || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res.success) {
          this.withdrawals = res.data.items;
          this.wdTotal = res.data.total;
          this.wdPage = res.data.page;
          this.wdTotalPages = res.data.totalPages;
          this.calcTotals();
        }
        this.wdLoading = false;
      });
  }

  calcTotals() {
    this.admin.getTransactions({ page: 1, limit: 1, type: 'deposit', status: 'completed' })
      .pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) this.totals.deposits = res.data.total;
    });
    this.admin.getTransactions({ page: 1, limit: 1, type: 'withdrawal', status: 'completed' })
      .pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) this.totals.withdrawals = res.data.total;
    });
    this.admin.getWithdrawals({ page: 1, limit: 1, status: 'pending' })
      .pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) {
        this.totals.pendingCount = res.data.total;
        this.totals.pendingAmount = 0;
      }
    });
    this.admin.getWithdrawals({ page: 1, limit: 100, status: 'pending' })
      .pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) {
        this.totals.pendingCount = res.data.total;
        this.totals.pendingAmount = res.data.items.reduce((sum: number, w: AdminWithdrawal) => sum + w.amount, 0);
      }
    });
  }

  loadTransactions() {
    this.txLoading = true;
    this.selectedTx = null;
    this.admin.getTransactions({
      page: this.txPage, limit: this.txLimit,
      type: this.txFilter.type || undefined,
      status: this.txFilter.status || undefined
    }).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) {
        this.transactions = res.data.items;
        this.txTotal = res.data.total;
        this.txPage = res.data.page;
        this.txTotalPages = res.data.totalPages;
      }
      this.txLoading = false;
    });
  }

  selectWithdrawal(w: AdminWithdrawal) {
    this.selectedWd = this.selectedWd === w ? null : w;
    this.showRejectForm = false;
    this.rejectReason = '';
  }

  approveWithdrawal(w: AdminWithdrawal) {
    this.wdActionLoading = true;
    this.admin.approveWithdrawal(w._id).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.wdActionLoading = false;
      if (res.success) {
        this.selectedWd = null;
        this.loadWithdrawals();
        this.loadDashboard();
        this.loadRecent();
        this.calcTotals();
      }
    });
  }

  rejectWithdrawal(w: AdminWithdrawal) {
    if (!this.rejectReason.trim()) return;
    this.wdActionLoading = true;
    this.admin.rejectWithdrawal(w._id, this.rejectReason).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.wdActionLoading = false;
      if (res.success) {
        this.selectedWd = null;
        this.showRejectForm = false;
        this.rejectReason = '';
        this.loadWithdrawals();
        this.calcTotals();
      }
    });
  }

  submitAdjustment() {
    this.adjustLoading = true;
    this.adjustResult = null;
    this.admin.adjustWallet(this.adjustData.userId, this.adjustData.amount, this.adjustData.type, this.adjustData.reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.adjustResult = { success: true, message: res.message || 'Adjustment successful' };
          this.adjustLoading = false;
          setTimeout(() => { this.showAdjustModal = false; this.adjustResult = null; this.refreshAll(); }, 1500);
        },
        error: (err) => {
          this.adjustResult = { success: false, message: err.error?.message || 'Adjustment failed' };
          this.adjustLoading = false;
        }
      });
  }

  barHeight(volume: number): number {
    const max = Math.max(...(this.dashData.dailyVolume || []).map(d => d.volume), 1);
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
