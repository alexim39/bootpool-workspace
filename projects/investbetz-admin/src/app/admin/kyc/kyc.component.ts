import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe, UpperCasePipe, DecimalPipe } from '@angular/common';
import { AdminService, AdminUser, KycReviewResult } from '../services/admin.service';
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

interface KycUser extends AdminUser {
  kycType?: string;
  kycNumber?: string;
  kycSubmittedAt?: string;
  kycReviewNote?: string;
  kycData?: { bvnVerifiedName?: string; ninVerifiedName?: string };
}

@Component({
  selector: 'app-kyc',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, UpperCasePipe, DecimalPipe, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatPaginatorModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>KYC Management</h1>
      </div>

      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="fill" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="onFilterChange()">
              <mat-option value="">All</mat-option>
              <mat-option value="pending">Pending</mat-option>
              <mat-option value="verified">Verified</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="fill" class="search-field">
            <mat-label>Search users...</mat-label>
            <input matInput [(ngModel)]="searchQuery" (input)="onSearchInput()" placeholder="Phone, name, email...">
          </mat-form-field>
        </div>
      </mat-card>

      <mat-card class="table-card">
        <div class="loading-shim" *ngIf="loading">
          <div class="spinner"></div>
        </div>
        <table mat-table [dataSource]="items" class="admin-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let u">{{ u.fullName || '-' }}</td>
          </ng-container>
          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>Phone</th>
            <td mat-cell *matCellDef="let u">{{ u.phone }}</td>
          </ng-container>
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>KYC Type</th>
            <td mat-cell *matCellDef="let u">{{ kycTypeLabel(u) }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let u">
              <span class="chip" [style.background]="u.kycVerified ? '#00E676' : '#E8B923'">
                {{ u.kycVerified ? 'Verified' : 'Pending' }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="submitted">
            <th mat-header-cell *matHeaderCellDef>Submitted</th>
            <td mat-cell *matCellDef="let u">{{ kycDateLabel(u) }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let u">
              <button mat-icon-button (click)="selectUser(u)" matTooltip="View Details"><mat-icon>visibility</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
        <div class="empty-state" *ngIf="!loading && items.length === 0">No users found</div>
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

    <div class="modal-overlay" *ngIf="selectedUser" (click)="selectedUser = null">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>KYC Details &mdash; {{ selectedUser.fullName }}</h2>
          <button mat-icon-button (click)="selectedUser = null"><mat-icon>close</mat-icon></button>
        </div>
        <div class="modal-body">
          <div class="info-grid">
            <div class="info-item"><span class="label">Phone</span><span class="value">{{ selectedUser.phone }}</span></div>
            <div class="info-item"><span class="label">Email</span><span class="value">{{ selectedUser.email || '-' }}</span></div>
            <div class="info-item"><span class="label">KYC Type</span><span class="value">{{ (selectedUser.kycType || 'N/A') | uppercase }}</span></div>
            <div class="info-item"><span class="label">KYC Number</span><span class="value">{{ selectedUser.kycNumber || '-' }}</span></div>
            <div class="info-item"><span class="label">Status</span><span class="value">
              <span class="chip" [style.background]="selectedUser.kycVerified ? '#00E676' : '#E8B923'">
                {{ selectedUser.kycVerified ? 'Verified' : 'Pending' }}
              </span>
            </span></div>
            <div class="info-item"><span class="label">Submitted</span><span class="value">{{ selectedUser.kycSubmittedAt ? (selectedUser.kycSubmittedAt | date:'medium') : '-' }}</span></div>
            <div class="info-item" *ngIf="selectedUser.kycData?.bvnVerifiedName"><span class="label">BVN Name</span><span class="value">{{ selectedUser.kycData!.bvnVerifiedName }}</span></div>
            <div class="info-item" *ngIf="selectedUser.kycData?.ninVerifiedName"><span class="label">NIN Name</span><span class="value">{{ selectedUser.kycData!.ninVerifiedName }}</span></div>
          </div>
          <div class="review-notes" *ngIf="selectedUser.kycReviewNote">
            <h4>Review Note</h4>
            <p>{{ selectedUser.kycReviewNote }}</p>
          </div>
          <div class="action-buttons" *ngIf="!selectedUser.kycVerified">
            <button mat-raised-button class="action-verify" (click)="verifyKyc(selectedUser)">
              <mat-icon>verified</mat-icon> Approve KYC
            </button>
            <button mat-stroked-button class="action-reject" (click)="showRejectForm = true">
              <mat-icon>cancel</mat-icon> Reject
            </button>
            <button mat-stroked-button class="action-ai-review" (click)="aiReview()" [disabled]="reviewing">
              <mat-icon>auto_awesome</mat-icon>
              {{ reviewing ? 'Reviewing...' : 'Ora Review' }}
            </button>
          </div>
          <div class="ai-review-panel" *ngIf="kycReview">
            <div class="ai-review-header">
              <mat-icon style="color:#CE93D8">auto_awesome</mat-icon>
              <span>Ora KYC Review</span>
              <button mat-icon-button (click)="kycReview = null"><mat-icon>close</mat-icon></button>
            </div>
            <div class="ai-review-body">
              <div class="ai-review-verdict">
                <span class="verdict-badge" [class.approve]="kycReview.recommendedAction === 'approve'" [class.reject]="kycReview.recommendedAction === 'reject'" [class.manual]="kycReview.recommendedAction === 'manual_review'">
                  {{ kycReview.recommendedAction === 'manual_review' ? 'Manual Review' : kycReview.recommendedAction.toUpperCase() }}
                </span>
                <span class="verdict-confidence">{{ kycReview.confidence }}% confidence</span>
              </div>
              <div class="ai-review-reasoning">{{ kycReview.reasoning }}</div>
              <div class="risk-flags" *ngIf="kycReview.riskFlags.length">
                <div class="risk-flag" *ngFor="let f of kycReview.riskFlags">
                  <mat-icon style="font-size:14px;color:#E8B923">warning_amber</mat-icon>
                  <span>{{ f }}</span>
                </div>
              </div>
              <div class="ai-review-details">
                <div class="detail-row"><span class="detail-label">Verified Name</span><span class="detail-value">{{ kycReview.verifiedName || 'N/A' }}</span></div>
                <div class="detail-row"><span class="detail-label">Names Match</span><span class="detail-value">{{ kycReview.namesMatch ? 'Yes' : 'No' }}</span></div>
                <div class="detail-row"><span class="detail-label">Account Age</span><span class="detail-value">{{ kycReview.accountAgeDays }} day(s)</span></div>
                <div class="detail-row"><span class="detail-label">Has Stakes</span><span class="detail-value">{{ kycReview.hasStakes ? 'Yes (\u20A6' + (kycReview.totalStakeVolume | number) + ')' : 'No' }}</span></div>
                <div class="detail-row" *ngIf="kycReview.duplicateBvnNin"><span class="detail-label">Duplicate {{ kycReview.kycType?.toUpperCase() }}</span><span class="detail-value" style="color:#f44336">{{ kycReview.duplicateAccountCount }} other account(s)</span></div>
              </div>
              <div class="ai-review-actions" *ngIf="kycReview.recommendedAction !== 'manual_review'">
                <button mat-raised-button [class.action-verify]="kycReview.recommendedAction === 'approve'" [class.action-reject]="kycReview.recommendedAction === 'reject'" (click)="executeAiVerdict()">
                  <mat-icon>{{ kycReview.recommendedAction === 'approve' ? 'verified' : 'cancel' }}</mat-icon>
                  Execute {{ kycReview.recommendedAction === 'approve' ? 'Approve' : 'Reject' }}
                </button>
                <button mat-button (click)="kycReview = null">Dismiss</button>
              </div>
            </div>
          </div>
          <div class="reject-section" *ngIf="showRejectForm">
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Rejection reason</mat-label>
              <textarea matInput [(ngModel)]="rejectNote" rows="2" placeholder="e.g. Invalid document, name mismatch"></textarea>
            </mat-form-field>
            <div class="reject-actions">
              <button mat-button (click)="showRejectForm = false; rejectNote = ''">Cancel</button>
              <button mat-raised-button color="warn" (click)="rejectKyc(selectedUser)">Confirm Reject</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1400px; }
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
    .chip { padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #fff; text-transform: capitalize; }
    .empty-state { padding: 32px; text-align: center; color: rgba(255,255,255,0.3); font-size: 14px; }
    .loading-shim { position: absolute; inset: 0; background: rgba(10,20,40,0.6); z-index: 10; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(0,230,118,0.2); border-top-color: #00E676; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: #0D1A30; border-radius: 12px; width: 100%; max-width: 560px; border: 1px solid rgba(255,255,255,0.08); max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .modal-header h2 { color: #fff; font-size: 18px; font-weight: 600; margin: 0; }
    .modal-header button { color: rgba(255,255,255,0.5); }
    .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-item { display: flex; flex-direction: column; gap: 2px; }
    .info-item .label { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; font-weight: 600; }
    .info-item .value { font-size: 14px; color: #fff; font-weight: 500; }
    .review-notes { padding: 12px; background: rgba(244,67,54,0.1); border-radius: 8px; }
    .review-notes h4 { color: #f44336; font-size: 13px; margin: 0 0 4px; }
    .review-notes p { color: rgba(255,255,255,0.7); font-size: 13px; margin: 0; }
    .action-buttons { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
    .action-verify { background: #00E676 !important; color: #0A1428 !important; font-weight: 600; }
    .action-reject { color: #f44336 !important; border-color: #f44336 !important; }
    .reject-section { padding: 12px; background: rgba(244,67,54,0.05); border-radius: 8px; display: flex; flex-direction: column; gap: 8px; }
    .full-width { width: 100%; }
    .reject-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .action-ai-review { color: #CE93D8 !important; border-color: #CE93D8 !important; }
    .ai-review-panel { background: rgba(206,147,216,0.08); border: 1px solid rgba(206,147,216,0.2); border-radius: 8px; overflow: hidden; }
    .ai-review-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #fff; font-size: 13px; font-weight: 500; }
    .ai-review-header button { margin-left: auto; color: rgba(255,255,255,0.4); }
    .ai-review-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
    .ai-review-verdict { display: flex; align-items: center; gap: 8px; }
    .verdict-badge { font-size: 12px; font-weight: 700; padding: 3px 12px; border-radius: 4px; }
    .verdict-badge.approve { background: rgba(0,230,118,0.15); color: #00E676; }
    .verdict-badge.reject { background: rgba(244,67,54,0.15); color: #f44336; }
    .verdict-badge.manual { background: rgba(255,152,0,0.15); color: #FF9800; }
    .verdict-confidence { color: rgba(255,255,255,0.4); font-size: 11px; }
    .ai-review-reasoning { color: rgba(255,255,255,0.7); font-size: 12px; line-height: 1.4; }
    .risk-flags { display: flex; flex-direction: column; gap: 4px; }
    .risk-flag { display: flex; align-items: center; gap: 6px; color: #E8B923; font-size: 12px; }
    .ai-review-details { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 6px; }
    .detail-row { display: flex; flex-direction: column; gap: 1px; }
    .detail-label { font-size: 10px; color: rgba(255,255,255,0.35); text-transform: uppercase; font-weight: 600; }
    .detail-value { font-size: 13px; color: #fff; }
    .ai-review-actions { display: flex; gap: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); }
  `]
})
export class KycComponent implements OnInit, OnDestroy {
  items: KycUser[] = [];
  total = 0;
  page = 1;
  limit = 20;
  totalPages = 0;
  searchQuery = '';
  statusFilter = '';
  selectedUser: KycUser | null = null;
  showRejectForm = false;
  rejectNote = '';
  loading = false;
  reviewing = false;
  kycReview: KycReviewResult | null = null;
  columns = ['name', 'phone', 'type', 'status', 'submitted', 'actions'];
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
      this.load();
    });
    this.load();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  kycTypeLabel(u: KycUser): string {
    return (u.kycType || '-').toUpperCase();
  }

  kycDateLabel(u: KycUser): string {
    if (!u.kycSubmittedAt) return '-';
    const d = new Date(u.kycSubmittedAt);
    return d.toLocaleDateString();
  }

  load() {
    this.loading = true;
    this.admin.getUsers({ page: this.page, limit: this.limit, search: this.searchQuery || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res.success) {
          const allUsers: KycUser[] = res.data.items as KycUser[];
          const kycUsers = allUsers.filter(u => u.kycType || u.kycNumber || u.kycSubmittedAt);
          if (this.statusFilter === 'verified') {
            this.items = kycUsers.filter(u => u.kycVerified);
          } else if (this.statusFilter === 'pending') {
            this.items = kycUsers.filter(u => !u.kycVerified);
          } else {
            this.items = kycUsers;
          }
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
    this.load();
  }

  onPageChange(e: PageEvent) {
    this.page = e.pageIndex + 1;
    this.limit = e.pageSize;
    this.load();
  }

  selectUser(u: KycUser) {
    this.showRejectForm = false;
    this.rejectNote = '';
    this.admin.getUser(u._id || u.id).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (res.success) this.selectedUser = res.data?.user || res.data;
    });
  }

  verifyKyc(u: KycUser) {
    this.admin.verifyUserKyc(u._id || u.id).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.selectedUser = null;
      this.load();
    });
  }

  rejectKyc(u: KycUser) {
    this.admin.rejectUserKyc(u._id || u.id, this.rejectNote || 'KYC documents rejected')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.selectedUser = null;
        this.showRejectForm = false;
        this.rejectNote = '';
        this.load();
      });
  }

  aiReview() {
    if (!this.selectedUser) return;
    this.reviewing = true;
    this.kycReview = null;
    this.admin.aiKycReview(this.selectedUser._id || this.selectedUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.kycReview = res.data;
          this.reviewing = false;
        },
        error: () => { this.reviewing = false; }
      });
  }

  executeAiVerdict() {
    if (!this.selectedUser || !this.kycReview) return;
    const uid = this.selectedUser._id || this.selectedUser.id;
    if (this.kycReview.recommendedAction === 'approve') {
      this.admin.aiKycApprove(uid).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.kycReview = null;
        this.selectedUser = null;
        this.load();
      });
    } else {
      this.admin.aiKycReject(uid, this.kycReview.reasoning).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.kycReview = null;
        this.selectedUser = null;
        this.load();
      });
    }
  }
}
