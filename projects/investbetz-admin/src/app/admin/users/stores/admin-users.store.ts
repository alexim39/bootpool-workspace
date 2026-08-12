import { Injectable, inject, signal, computed } from '@angular/core';
import { AdminService, AdminUser, UserGrowthData } from '../../services';
import { Subject, debounceTime, distinctUntilChanged, finalize, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminUsersStore {
  private admin = inject(AdminService);
  private search$ = new Subject<string>();

  readonly items = signal<AdminUser[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(50);
  readonly totalPages = signal(0);
  readonly searchQuery = signal('');
  readonly statusFilter = signal('all');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly sortBy = signal('createdAt');
  readonly sortOrder = signal<'asc' | 'desc'>('desc');
  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  readonly saving = signal(false);
  readonly selectedUser = signal<any>(null);
  readonly stats = signal<{ total: number; active: number; suspended: number; kycVerified: number; kycPending: number; admins: number } | null>(null);
  readonly roleFilter = signal<'user' | 'admin'>('user');
  readonly growthPeriod = signal<'day' | 'week' | 'month' | 'year'>('day');
  readonly growth = signal<UserGrowthData | null>(null);
  readonly growthLoading = signal(false);

  readonly columns = ['phone', 'name', 'email', 'wallet', 'status', 'kyc', 'lastActive', 'registered', 'actions'];

  readonly rangeEnd = computed(() => Math.min(this.page() * this.limit(), this.total()));
  readonly visiblePages = computed(() => {
    const tp = this.totalPages();
    const cp = this.page();
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
    if (cp <= 3) return [1, 2, 3, 4, '...', tp - 1, tp];
    if (cp >= tp - 2) return [1, 2, '...', tp - 3, tp - 2, tp - 1, tp];
    return [1, '...', cp - 1, cp, cp + 1, '...', tp];
  });

  constructor() {
    this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  setSort(column: string) {
    if (this.sortBy() === column) {
      this.sortOrder.update(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(column);
      this.sortOrder.set('desc');
    }
    this.page.set(1);
    this.load();
  }

  sortIcon(column: string): string {
    if (this.sortBy() !== column) return 'unfold_more';
    return this.sortOrder() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  load() {
    this.loading.set(true);
    this.admin.getUsers({
      page: this.page(), limit: this.limit(),
      search: this.searchQuery() || undefined,
      status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder(),
      role: this.roleFilter(),
    }).subscribe(res => {
      if (res.success) {
        this.items.set(res.data.items);
        this.total.set(res.data.total);
        this.page.set(res.data.page);
        this.limit.set(res.data.limit);
        this.totalPages.set(res.data.totalPages);
        if (res.data.stats) this.stats.set(res.data.stats);
      }
      this.loading.set(false);
    });
  }

  loadGrowth(period: 'day' | 'week' | 'month' | 'year') {
    this.growthPeriod.set(period);
    this.growthLoading.set(true);
    this.admin.getUserGrowth(period).subscribe(res => {
      if (res.success) this.growth.set(res.data);
      this.growthLoading.set(false);
    });
  }

  setGrowthPeriod(period: 'day' | 'week' | 'month' | 'year') {
    if (period === this.growthPeriod()) return;
    this.loadGrowth(period);
  }

  setPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.load();
  }

  setLimit(l: number) {
    this.limit.set(l);
    this.page.set(1);
    this.load();
  }

  onSearchInput() {
    this.search$.next(this.searchQuery());
  }

  setStatusFilter(s: string) {
    this.statusFilter.set(s);
    this.page.set(1);
    this.load();
  }

  setRoleFilter(role: 'user' | 'admin') {
    this.roleFilter.set(role);
    this.statusFilter.set('all');
    this.page.set(1);
    this.load();
  }

  setDateFrom(d: string) {
    this.dateFrom.set(d);
    this.page.set(1);
    this.load();
  }

  setDateTo(d: string) {
    this.dateTo.set(d);
    this.page.set(1);
    this.load();
  }

  clearDates() {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.page.set(1);
    this.load();
  }

  loadUser(id: string) {
    this.detailLoading.set(true);
    this.admin.getUser(id).subscribe((res: any) => {
      this.detailLoading.set(false);
      if (res.success) this.selectedUser.set(res.data);
    });
  }

  updateUser(id: string, payload: { fullName?: string; phone?: string; email?: string; role?: 'user' | 'admin'; isSuspended?: boolean; isAffiliate?: boolean }) {
    this.saving.set(true);
    return this.admin.updateUser(id, payload).pipe(
      tap(res => {
        if (res.success && this.selectedUser()) {
          this.selectedUser.set({ ...this.selectedUser(), user: res.data });
        }
      }),
      finalize(() => this.saving.set(false)),
    );
  }

  toggleStatus(u: AdminUser) {
    this.admin.toggleUserStatus(u._id || u.id).subscribe(() => this.load());
  }

  toggleAffiliate(u: AdminUser) {
    this.updateUser(u._id || u.id, { isAffiliate: !u.isAffiliate }).subscribe(() => this.load());
  }

  toggleUserById(id: string) {
    this.admin.toggleUserStatus(id).subscribe(() => this.loadUser(id));
  }

  verifyKyc(u: AdminUser) {
    this.admin.verifyUserKyc(u._id || u.id).subscribe(() => this.load());
  }

  verifyUserKycById(id: string) {
    this.admin.verifyUserKyc(id).subscribe(() => this.loadUser(id));
  }

  exportCsv() {
    const rows = this.items();
    const header = 'Phone,Name,Email,Status,KYC,Wallet Balance,Last Login,Registered\n';
    const csv = header + rows.map(u =>
      `"${u.phone}","${u.fullName}","${u.email || ''}","${u.isSuspended ? 'Suspended' : 'Active'}","${u.kycVerified ? 'Verified' : 'Pending'}","${u.walletBalance ?? 0}","${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : ''}","${new Date(u.createdAt).toLocaleDateString()}"`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
