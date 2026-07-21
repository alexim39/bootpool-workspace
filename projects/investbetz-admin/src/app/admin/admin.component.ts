import { Component, signal, inject, computed, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationStart, NavigationEnd } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminAuthService } from '../auth/admin-auth.service';
import { AdminService } from './services/admin.service';
import { Subject, takeUntil, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor, NgIf, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="admin-shell">
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-icon">B</span>
            <span class="logo-text" *ngIf="!sidebarCollapsed()">BetPool</span>
          </div>
          <button mat-icon-button class="toggle-btn" (click)="sidebarCollapsed.set(!sidebarCollapsed())">
            <mat-icon>{{ sidebarCollapsed() ? 'menu' : 'close' }}</mat-icon>
          </button>
        </div>

        <nav class="nav-list">
          <a *ngFor="let item of navItems" class="nav-item"
             [routerLink]="item.path"
             routerLinkActive="active"
             [routerLinkActiveOptions]="{ exact: item.exact }"
             [title]="item.label">
            <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">{{ item.label }}</span>
            <span class="nav-badge" *ngIf="item.badge && pendingTotal > 0 && !sidebarCollapsed()">{{ pendingTotal }}</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info" *ngIf="!sidebarCollapsed()">
            <div class="avatar">{{ (user()?.fullName || 'A')[0] }}</div>
            <div class="user-details">
              <div class="user-name">{{ user()?.fullName || 'Admin' }}</div>
              <div class="user-role">Administrator</div>
            </div>
          </div>
          <button mat-icon-button class="logout-btn" title="Logout" (click)="auth.logout()">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </aside>

      <main class="main-content" [class.expanded]="sidebarCollapsed()">
        <div class="route-loader" *ngIf="routeLoading()">
          <mat-spinner diameter="32"></mat-spinner>
        </div>
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .admin-shell { display: flex; height: 100vh; background: #0A1428; }
    .sidebar {
      width: 260px; min-width: 260px; background: #0D1A30;
      display: flex; flex-direction: column; border-right: 1px solid rgba(255,255,255,0.05);
      transition: width 0.25s ease, min-width 0.25s ease; overflow: hidden;
    }
    .sidebar.collapsed { width: 64px; min-width: 64px; }
    .sidebar-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon {
      width: 36px; height: 36px; background: #00E676; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 18px; color: #0A1428; flex-shrink: 0;
    }
    .logo-text { font-weight: 700; font-size: 18px; color: #fff; white-space: nowrap; }
    .toggle-btn { color: rgba(255,255,255,0.6); width: 32px; height: 32px; line-height: 32px; }
    .toggle-btn mat-icon { font-size: 20px; }
    .nav-list { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }
    .nav-item {
      display: flex; align-items: center; gap: 12px; padding: 10px 12px;
      border-radius: 8px; color: rgba(255,255,255,0.6); text-decoration: none;
      font-size: 14px; font-weight: 500; transition: all 0.15s; cursor: pointer; position: relative;
    }
    .nav-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
    .nav-item.active { background: rgba(0,230,118,0.12); color: #00E676; }
    .nav-icon { font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; }
    .nav-label { white-space: nowrap; }
    .nav-badge {
      position: absolute; right: 10px; background: #E8B923; color: #0A1428;
      font-size: 10px; font-weight: 700; min-width: 18px; height: 18px;
      border-radius: 9px; display: flex; align-items: center; justify-content: center;
      padding: 0 5px;
    }
    .sidebar-footer {
      padding: 12px 8px; border-top: 1px solid rgba(255,255,255,0.05);
      display: flex; align-items: center; gap: 8px;
    }
    .user-info { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%; background: #E8B923;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 16px; color: #0A1428; flex-shrink: 0;
    }
    .user-details { min-width: 0; }
    .user-name { font-size: 13px; font-weight: 600; color: #fff; }
    .user-role { font-size: 11px; color: rgba(255,255,255,0.4); }
    .logout-btn { color: rgba(255,255,255,0.5); width: 36px; height: 36px; line-height: 36px; }
    .logout-btn:hover { color: #f44336; }
    .main-content {
      flex: 1; overflow-y: auto; padding: 24px;
      background: #0A1428; transition: margin-left 0.25s ease;
    }
    .route-loader {
      position: fixed; top: 0; left: 0; right: 0; z-index: 2000;
      display: flex; justify-content: center; padding: 8px;
      pointer-events: none;
    }
    @media (max-width: 768px) {
      .sidebar { width: 64px; min-width: 64px; }
      .sidebar.collapsed { width: 0; min-width: 0; }
      .main-content { padding: 16px; }
    }
  `]
})
export class AdminComponent implements OnInit, OnDestroy {
  private authService = inject(AdminAuthService);
  private router = inject(Router);
  private adminService = inject(AdminService);
  sidebarCollapsed = signal(false);
  routeLoading = signal(false);
  user = computed(() => this.authService.user());
  pendingTotal = 0;
  private sub: any;
  private destroy$ = new Subject<void>();

  navItems = [
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard', exact: true, badge: false },
    { path: '/admin/pods', icon: 'sports_esports', label: 'Pods', exact: false, badge: true },
    { path: '/admin/betting', icon: 'sports_kabaddi', label: 'Betting', exact: false, badge: false },
    { path: '/admin/match-pools', icon: 'pool', label: 'Match Pools', exact: false, badge: false },
    { path: '/admin/users', icon: 'people', label: 'Users', exact: false, badge: false },
    { path: '/admin/stakes', icon: 'casino', label: 'Stakes', exact: false, badge: false },
    { path: '/admin/withdraw-mgt', icon: 'account_balance', label: 'Withdrawals', exact: false, badge: false },
    { path: '/admin/kyc', icon: 'verified', label: 'KYC', exact: false, badge: false },
    { path: '/admin/transactions', icon: 'receipt', label: 'Transactions', exact: false, badge: false },
    { path: '/admin/bi-reports', icon: 'analytics', label: 'BI Reports', exact: false, badge: false },
    { path: '/admin/deposit-mgt', icon: 'payments', label: 'Deposits', exact: false, badge: false },
    { path: '/admin/campaigns', icon: 'campaign', label: 'Campaigns', exact: false, badge: false },
    { path: '/admin/featured-games', icon: 'star', label: 'Featured Games', exact: false, badge: false },
    { path: '/admin/ora-chat', icon: 'smart_toy', label: 'ORA Chat', exact: false, badge: false },
    { path: '/admin/settings', icon: 'settings', label: 'Settings', exact: false, badge: false },
  ];

  ngOnInit() {
    this.sub = this.router.events.subscribe(e => {
      if (e instanceof NavigationStart) this.routeLoading.set(true);
      if (e instanceof NavigationEnd) this.routeLoading.set(false);
    });
    this.refreshPendingCount();

    interval(60000).pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => this.refreshPendingCount());
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshPendingCount() {
    this.adminService.getPendingReviewCount().pipe(takeUntil(this.destroy$)).subscribe({
      next: res => { if (res.success) this.pendingTotal = res.data.disputed + res.data.stuck; },
      error: () => {},
    });
  }

  get auth() { return this.authService; }
}
