import { Injectable, inject, signal } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AdminService, AdminStake } from '../../services';

@Injectable({ providedIn: 'root' })
export class AdminStakesStore {
  readonly admin = inject(AdminService);
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  readonly stakes = signal<AdminStake[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly totalPages = signal(0);
  readonly searchQuery = signal('');
  readonly statusFilter = signal('');
  readonly selectedStake = signal<AdminStake | null>(null);
  readonly loading = signal(false);

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.page.set(1);
      this.loadStakes();
    });
  }

  destroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStakes() {
    this.loading.set(true);
    this.admin.getStakes({ page: this.page(), limit: this.limit(), status: this.statusFilter() || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res.success) {
          this.stakes.set(res.data.items);
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

  onFilterChange() {
    this.page.set(1);
    this.loadStakes();
  }

  selectStake(s: AdminStake) {
    const id = s._id || s.id;
    if (!id) return;
    this.admin.getStake(id).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) this.selectedStake.set(res.data);
    });
  }

  settleStake(id: string, result: string) {
    this.admin.settleStake(id, result).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadStakes();
    });
  }

  settleLeg(id: string, legIndex: number, result: string) {
    this.admin.settleStakeLeg(id, legIndex, result).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadStakes();
    });
  }
}
