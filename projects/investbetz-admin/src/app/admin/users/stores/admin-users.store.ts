import { Injectable, inject, signal, computed } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService, AdminUser, UserGrowthData } from '../../services';
import { Subject, debounceTime, distinctUntilChanged, finalize, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminUsersStore {
  private admin = inject(AdminService);
  private snackBar = inject(MatSnackBar);
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

  readonly columns = ['select', 'phone', 'name', 'email', 'wallet', 'status', 'kyc', 'lastActive', 'registered', 'actions'];

  readonly rangeEnd = computed(() => Math.min(this.page() * this.limit(), this.total()));

  readonly selectedIds = signal<string[]>([]);
  readonly selectedCount = computed(() => this.selectedIds().length);
  readonly pageAllSelected = computed(() => this.items().length > 0 && this.items().every(u => this.selectedIds().includes(u._id || u.id)));
  readonly pageSomeSelected = computed(() => {
    const sel = new Set(this.selectedIds());
    return this.items().some(u => sel.has(u._id || u.id)) && !this.pageAllSelected();
  });

  isSelected(u: AdminUser): boolean {
    return this.selectedIds().includes(u._id || u.id);
  }

  toggleSelect(u: AdminUser) {
    const id = u._id || u.id;
    this.selectedIds.update(cur => cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id].slice(0, 500));
  }

  toggleSelectAll() {
    if (this.pageAllSelected()) {
      const ids = new Set(this.items().map(u => u._id || u.id));
      this.selectedIds.update(cur => cur.filter(x => !ids.has(x)));
    } else {
      const ids = new Set(this.selectedIds());
      this.items().forEach(u => ids.add(u._id || u.id));
      this.selectedIds.set([...ids].slice(0, 500));
    }
  }

  clearSelection() {
    this.selectedIds.set([]);
  }
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
      this.clearSelection();
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
    this.clearSelection();
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
    this.clearSelection();
    this.load();
  }

  onSearchInput() {
    this.search$.next(this.searchQuery());
  }

  setStatusFilter(s: string) {
    this.statusFilter.set(s);
    this.page.set(1);
    this.clearSelection();
    this.load();
  }

  setRoleFilter(role: 'user' | 'admin') {
    this.roleFilter.set(role);
    this.statusFilter.set('all');
    this.page.set(1);
    this.clearSelection();
    this.load();
  }

  setDateFrom(d: string) {
    this.dateFrom.set(d);
    this.page.set(1);
    this.clearSelection();
    this.load();
  }

  setDateTo(d: string) {
    this.dateTo.set(d);
    this.page.set(1);
    this.clearSelection();
    this.load();
  }

  clearDates() {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.page.set(1);
    this.clearSelection();
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

  readonly deletingUser = signal(false);

  deleteUserById(id: string) {
    this.deletingUser.set(true);
    this.admin.deleteUser(id).subscribe({
      next: (res) => {
        this.deletingUser.set(false);
        this.loadUser(id);
        this.load();
        this.snackBar.open(res.message || 'User deleted', 'OK', { duration: 4000, panelClass: 'snack-success' });
      },
      error: (err) => {
        this.deletingUser.set(false);
        this.snackBar.open(err?.error?.message || 'Failed to delete user', 'OK', { duration: 4000, panelClass: 'snack-error' });
      },
    });
  }

  verifyKyc(u: AdminUser) {
    this.admin.verifyUserKyc(u._id || u.id).subscribe(() => this.load());
  }

  verifyUserKycById(id: string) {
    this.admin.verifyUserKyc(id).subscribe(() => this.loadUser(id));
  }

  readonly bulkBusy = signal(false);

  bulkAction(action: string, onDone?: (message: string, isError: boolean) => void) {
    const ids = this.selectedIds();
    if (!ids.length) return;
    this.bulkBusy.set(true);
    this.admin.bulkUserAction(ids, action).subscribe({
      next: res => {
        this.bulkBusy.set(false);
        if (res.success) {
          const d = res.data;
          let msg = res.message || 'Bulk action applied';
          if (d.excluded?.length) msg += ` (${d.excluded.length} excluded — cannot suspend own account)`;
          this.clearSelection();
          this.load();
          onDone?.(msg, false);
        } else {
          onDone?.(res.message || 'Bulk action failed', true);
        }
      },
      error: e => {
        this.bulkBusy.set(false);
        onDone?.(e.error?.message || 'Bulk action failed', true);
      },
    });
  }

  exportCsv(selectedOnly = false) {
    const rows = selectedOnly ? this.items().filter(u => this.isSelected(u)) : this.items();
    if (!rows.length) return;
    const header = 'Phone,Name,Email,Status,KYC,Wallet Balance,Last Login,Registered\n';
    const csv = header + rows.map(u =>
      `"${u.phone}","${u.fullName}","${u.email || ''}","${u.isSuspended ? 'Suspended' : 'Active'}","${u.kycVerified ? 'Verified' : 'Pending'}","${u.walletBalance ?? 0}","${(u.lastActiveAt || u.lastLoginAt) ? new Date(u.lastActiveAt || u.lastLoginAt!).toLocaleDateString() : ''}","${new Date(u.createdAt).toLocaleDateString()}"`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedOnly ? 'selected_users' : 'users'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
