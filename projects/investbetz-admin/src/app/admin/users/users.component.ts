import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf } from '@angular/common';
import { AdminService, AdminUser } from '../services/admin.service';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [NgIf, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatCardModule, MatPaginatorModule],
  template: `
    <div class="users-page">
      <div class="page-header">
        <h1>Users</h1>
      </div>

      <mat-card class="filter-card">
        <mat-form-field appearance="fill" class="search-field">
          <mat-label>Search users...</mat-label>
          <input matInput [(ngModel)]="searchQuery" (input)="onSearchInput()" placeholder="Phone, name, email...">
        </mat-form-field>
      </mat-card>

      <mat-card class="table-card">
        <div class="loading-shim" *ngIf="loading">
          <div class="spinner"></div>
        </div>
        <table mat-table [dataSource]="users" class="admin-table">
          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>Phone</th>
            <td mat-cell *matCellDef="let u" class="clickable" (click)="viewUser(u)">{{ u.phone }}</td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let u" class="clickable" (click)="viewUser(u)">{{ u.fullName }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let u">{{ u.email || '-' }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let u">
              <span class="chip" [style.background]="u.isSuspended ? '#f44336' : '#00E676'">
                {{ u.isSuspended ? 'Suspended' : 'Active' }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="kyc">
            <th mat-header-cell *matHeaderCellDef>KYC</th>
            <td mat-cell *matCellDef="let u">
              <span class="chip" [style.background]="u.kycVerified ? '#00E676' : '#666'">
                {{ u.kycVerified ? 'Verified' : 'Pending' }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let u">
              <button mat-icon-button (click)="toggleStatus(u)" [matTooltip]="u.isSuspended ? 'Activate' : 'Suspend'">
                <mat-icon>{{ u.isSuspended ? 'check_circle' : 'block' }}</mat-icon>
              </button>
              <button mat-icon-button (click)="verifyKyc(u)" matTooltip="Toggle KYC">
                <mat-icon>verified</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
        <div class="empty-state" *ngIf="!loading && users.length === 0">No users found</div>
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
    .users-page { max-width: 1400px; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { color: #fff; font-size: 24px; font-weight: 600; margin: 0; }
    .filter-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 16px; padding: 8px 16px; }
    .search-field { width: 100%; }
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
  `]
})
export class UsersComponent implements OnInit, OnDestroy {
  users: AdminUser[] = [];
  total = 0;
  page = 1;
  limit = 20;
  totalPages = 0;
  searchQuery = '';
  loading = false;
  columns = ['phone', 'name', 'email', 'status', 'kyc', 'actions'];
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  constructor(private admin: AdminService, private router: Router) {}

  ngOnInit() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.page = 1;
      this.loadUsers();
    });
    this.loadUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers() {
    this.loading = true;
    this.admin.getUsers({ page: this.page, limit: this.limit, search: this.searchQuery || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res.success) {
          this.users = res.data.items;
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

  onPageChange(e: PageEvent) {
    this.page = e.pageIndex + 1;
    this.limit = e.pageSize;
    this.loadUsers();
  }

  viewUser(u: AdminUser) {
    this.router.navigate(['/admin/users', u.id]);
  }

  toggleStatus(u: AdminUser) {
    this.admin.toggleUserStatus(u.id).pipe(takeUntil(this.destroy$)).subscribe(() => this.loadUsers());
  }

  verifyKyc(u: AdminUser) {
    this.admin.verifyUserKyc(u.id).pipe(takeUntil(this.destroy$)).subscribe(() => this.loadUsers());
  }
}
