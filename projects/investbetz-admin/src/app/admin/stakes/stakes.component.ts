import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { AdminService, AdminStake } from '../services/admin.service';
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
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-stakes',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, SlicePipe, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatPaginatorModule],
  template: `
    <div class="stakes-page">
      <div class="page-header">
        <h1>Stakes</h1>
      </div>

      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="fill" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="onFilterChange()">
              <mat-option value="">All</mat-option>
              <mat-option value="pending">Pending</mat-option>
              <mat-option value="confirmed">Confirmed</mat-option>
              <mat-option value="active">Active</mat-option>
              <mat-option value="won">Won</mat-option>
              <mat-option value="lost">Lost</mat-option>
              <mat-option value="void">Void</mat-option>
              <mat-option value="cashed_out">Cashed Out</mat-option>
              <mat-option value="cancelled">Cancelled</mat-option>
              <mat-option value="refunded">Refunded</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="fill" class="search-field">
            <mat-label>Search by user or pod...</mat-label>
            <input matInput [(ngModel)]="searchQuery" (input)="onSearchInput()">
          </mat-form-field>
        </div>
      </mat-card>

      <div class="detail-panel" *ngIf="selectedStake as s">
        <div class="panel-header">
          <h3>Stake Details</h3>
          <button mat-icon-button (click)="selectedStake = null"><mat-icon>close</mat-icon></button>
        </div>
        <div class="panel-body">
          <div class="section-title">User</div>
          <div class="detail-grid">
            <div class="detail-item"><span class="label">Phone</span><span class="value">{{ s.user?.phone }}</span></div>
            <div class="detail-item"><span class="label">Name</span><span class="value">{{ s.user?.fullName || s.user?.name }}</span></div>
            <div class="detail-item"><span class="label">Email</span><span class="value">{{ s.user?.email }}</span></div>
            <div class="detail-item"><span class="label">User ID</span><span class="value">{{ s.userId }}</span></div>
          </div>
          <div class="section-title">Stake</div>
          <div class="detail-grid">
            <div class="detail-item"><span class="label">Stake ID</span><span class="value">{{ s._id || s.id }}</span></div>
            <div class="detail-item"><span class="label">Status</span><span class="value"><span class="chip" [style.background]="statusColor(s.status)">{{ s.status }}</span></span></div>
            <div class="detail-item"><span class="label">Amount</span><span class="value">\u20A6{{ s.stakeAmount | number }}</span></div>
            <div class="detail-item"><span class="label">Potential Payout</span><span class="value">\u20A6{{ s.potentialPayout | number }}</span></div>
            <div class="detail-item" *ngIf="s.netPayout"><span class="label">Net Payout</span><span class="value">\u20A6{{ s.netPayout | number }}</span></div>
            <div class="detail-item" *ngIf="s.platformFee"><span class="label">Platform Fee (35%)</span><span class="value">\u20A6{{ s.platformFee | number }}</span></div>
            <div class="detail-item" *ngIf="s.isSettled"><span class="label">Settled</span><span class="value">{{ s.settledAt | date:'medium' }}</span></div>
            <div class="detail-item"><span class="label">Created</span><span class="value">{{ s.createdAt | date:'medium' }}</span></div>
            <div class="detail-item" *ngIf="s.settlementNotes"><span class="label">Notes</span><span class="value">{{ s.settlementNotes }}</span></div>
          </div>
          <div class="section-title">Pod</div>
          <div class="detail-grid">
            <div class="detail-item"><span class="label">Title</span><span class="value">{{ s.pod?.title || s.podId }}</span></div>
            <div class="detail-item" *ngIf="s.pod?.sport"><span class="label">Sport</span><span class="value">{{ s.pod.sport }}</span></div>
            <div class="detail-item" *ngIf="s.pod?.league"><span class="label">League</span><span class="value">{{ s.pod.league }}</span></div>
            <div class="detail-item" *ngIf="s.pod?.marketType"><span class="label">Market</span><span class="value">{{ s.pod.marketType }}</span></div>
            <div class="detail-item" *ngIf="s.pod?.odds"><span class="label">Odds</span><span class="value">{{ s.pod.odds }}</span></div>
            <div class="detail-item" *ngIf="s.pod?.minStake"><span class="label">Min Stake</span><span class="value">\u20A6{{ s.pod.minStake | number }}</span></div>
            <div class="detail-item" *ngIf="s.pod?.maxStake"><span class="label">Max Stake</span><span class="value">\u20A6{{ s.pod.maxStake | number }}</span></div>
            <div class="detail-item" *ngIf="s.pod?.selection"><span class="label">Selection</span><span class="value">{{ s.pod.selection }}</span></div>
            <div class="detail-item" *ngIf="s.pod?.participants?.length"><span class="label">Participants</span><span class="value">{{ s.pod.participants.join(' vs ') }}</span></div>
            <div class="detail-item" *ngIf="s.combinedMultiplier"><span class="label">Combined Odds</span><span class="value" style="color:#CE93D8">{{ s.combinedMultiplier.toFixed(2) }}x</span></div>
          </div>
          <div class="section-title" *ngIf="s.items && s.items.length > 1">Parlay Legs ({{ s.items.length }})</div>
          <div class="detail-grid" *ngIf="s.items && s.items.length > 1">
            <div class="detail-item parlay-leg-item" *ngFor="let item of s.items; let i = index">
              <span class="label">Leg {{ i + 1 }} — {{ item.homeTeam }} vs {{ item.awayTeam }}</span>
              <span class="value">{{ item.selection }} &#64; {{ item.gainsMultiplier.toFixed(2) }}x</span>
              <span class="value" [style.color]="item.status === 'won' ? '#00E676' : item.status === 'lost' ? '#f44336' : '#888'">{{ item.status }}</span>
            </div>
          </div>
          <div class="settle-actions" *ngIf="canSettle(s)">
            <button mat-stroked-button class="action-win" (click)="settleStake(s._id || s.id, 'win')">Settle Win</button>
            <button mat-stroked-button class="action-loss" (click)="settleStake(s._id || s.id, 'loss')">Settle Loss</button>
            <button mat-stroked-button class="action-void" (click)="settleStake(s._id || s.id, 'void')">Void</button>
          </div>
        </div>
      </div>

      <mat-card class="table-card">
        <div class="loading-shim" *ngIf="loading">
          <div class="spinner"></div>
        </div>
        <table mat-table [dataSource]="stakes" class="admin-table">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let s" class="clickable" (click)="selectStake(s)">{{ (s._id || s.id) | slice:0:8 }}...</td>
          </ng-container>
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>User</th>
            <td mat-cell *matCellDef="let s" class="clickable" (click)="selectStake(s)">{{ s.user?.phone || s.userId | slice:0:10 }}</td>
          </ng-container>
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Amount</th>
            <td mat-cell *matCellDef="let s" class="clickable" (click)="selectStake(s)">\u20A6{{ s.stakeAmount | number }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let s">
              <span class="chip" [style.background]="statusColor(s.status)">{{ s.status }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let s" class="clickable" (click)="selectStake(s)">{{ s.createdAt | date:'short' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let s">
              <button mat-icon-button (click)="selectStake(s)" matTooltip="View"><mat-icon>visibility</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
        <div class="empty-state" *ngIf="!loading && stakes.length === 0">No stakes found</div>
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
    .stakes-page { max-width: 1400px; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { color: #fff; font-size: 24px; font-weight: 600; margin: 0; }
    .filter-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 16px; padding: 8px 16px; }
    .filters { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 200px; }
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
    .section-title { font-size: 11px; color: #00E676; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin: 16px 0 8px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .section-title:first-of-type { margin-top: 0; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .detail-item .label { font-size: 10px; color: rgba(255,255,255,0.35); text-transform: uppercase; font-weight: 600; letter-spacing: 0.3px; }
    .detail-item .value { font-size: 13px; color: #fff; font-weight: 500; word-break: break-all; }
    .settle-actions { display: flex; gap: 8px; margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
    .action-win { color: #00E676 !important; border-color: #00E676 !important; }
    .action-loss { color: #f44336 !important; border-color: #f44336 !important; }
    .action-void { color: #888 !important; border-color: #888 !important; }
  `]
})
export class StakesComponent implements OnInit, OnDestroy {
  stakes: AdminStake[] = [];
  total = 0;
  page = 1;
  limit = 20;
  totalPages = 0;
  searchQuery = '';
  statusFilter = '';
  selectedStake: AdminStake | null = null;
  loading = false;
  columns = ['id', 'user', 'amount', 'status', 'createdAt', 'actions'];
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  constructor(private admin: AdminService) {}

  ngOnInit() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.page = 1;
      this.loadStakes();
    });
    this.loadStakes();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStakes() {
    this.loading = true;
    this.admin.getStakes({ page: this.page, limit: this.limit, status: this.statusFilter || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res.success) {
          this.stakes = res.data.items;
          this.total = res.data.total;
          this.page = res.data.page;
          this.limit = res.data.limit;
          this.totalPages = res.data.totalPages;
        }
        this.loading = false;
      });
  }

  onSearchInput() {
    this.search$.next(this.searchQuery);
  }

  onFilterChange() {
    this.page = 1;
    this.loadStakes();
  }

  onPageChange(e: PageEvent) {
    this.page = e.pageIndex + 1;
    this.limit = e.pageSize;
    this.loadStakes();
  }

  private stakeId(s: AdminStake): string {
    return s._id || s.id;
  }

  selectStake(s: AdminStake) {
    const id = this.stakeId(s);
    if (!id) return;
    this.admin.getStake(id).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) this.selectedStake = res.data;
    });
  }

  canSettle(s: AdminStake): boolean {
    return ['pending', 'confirmed', 'active'].includes(s.status);
  }

  settleStake(id: string, result: string) {
    this.admin.settleStake(id, result).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.selectedStake = null;
      this.loadStakes();
    });
  }

  statusColor(s: string): string {
    const map: Record<string, string> = { pending: '#E8B923', confirmed: '#00E676', active: '#E8B923', won: '#00E676', lost: '#888', void: '#666', cashed_out: '#2196f3', cancelled: '#f44336', refunded: '#888' };
    return map[s] || '#555';
  }
}
