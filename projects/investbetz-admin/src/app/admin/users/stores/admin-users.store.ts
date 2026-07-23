import { Injectable, inject, signal } from '@angular/core';
import { AdminService, AdminUser } from '../../services';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class AdminUsersStore {
  private admin = inject(AdminService);
  private search$ = new Subject<string>();

  readonly items = signal<AdminUser[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly totalPages = signal(0);
  readonly searchQuery = signal('');
  readonly loading = signal(false);
  readonly selectedUser = signal<any>(null);

  readonly columns = ['phone', 'name', 'email', 'status', 'kyc', 'actions'];

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  load() {
    this.loading.set(true);
    this.admin.getUsers({ page: this.page(), limit: this.limit(), search: this.searchQuery() || undefined })
      .subscribe(res => {
        if (res.success) {
          this.items.set(res.data.items);
          this.total.set(res.data.total);
          this.page.set(res.data.page);
          this.limit.set(res.data.limit);
          this.totalPages.set(res.data.totalPages);
        }
        this.loading.set(false);
      });
  }

  onSearchInput() {
    this.search$.next(this.searchQuery());
  }

  onPageChange(index: number, pageSize: number) {
    this.page.set(index + 1);
    this.limit.set(pageSize);
    this.load();
  }

  loadUser(id: string) {
    this.admin.getUser(id).subscribe((res: any) => {
      if (res.success) this.selectedUser.set(res.data);
    });
  }

  toggleStatus(u: AdminUser) {
    this.admin.toggleUserStatus(u.id).subscribe(() => this.load());
  }

  toggleUserById(id: string) {
    this.admin.toggleUserStatus(id).subscribe(() => this.loadUser(id));
  }

  verifyKyc(u: AdminUser) {
    this.admin.verifyUserKyc(u.id).subscribe(() => this.load());
  }

  verifyUserKycById(id: string) {
    this.admin.verifyUserKyc(id).subscribe(() => this.loadUser(id));
  }
}
