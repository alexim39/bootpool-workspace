import { Component, signal, inject, computed, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationStart, NavigationEnd } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminAuthService } from '../auth';
import { AdminService } from './services/admin.service';
import { Subject, takeUntil, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor, NgIf, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
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
    { path: '/admin/financials', icon: 'account_balance', label: 'Financials', exact: false, badge: true },
    { path: '/admin/withdraw-mgt', icon: 'money_off', label: 'Withdrawals', exact: false, badge: false },
    { path: '/admin/kyc', icon: 'verified', label: 'KYC', exact: false, badge: false },
    { path: '/admin/transactions', icon: 'receipt', label: 'Transactions', exact: false, badge: false },
    { path: '/admin/bi-reports', icon: 'analytics', label: 'BI Reports', exact: false, badge: false },
    { path: '/admin/deposit-mgt', icon: 'payments', label: 'Deposits', exact: false, badge: false },
    { path: '/admin/campaigns', icon: 'campaign', label: 'Campaigns', exact: false, badge: false },
    { path: '/admin/featured-games', icon: 'star', label: 'Featured Games', exact: false, badge: false },
    { path: '/admin/bet-manager', icon: 'account_balance_wallet', label: 'Bet Manager', exact: false, badge: false },
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
