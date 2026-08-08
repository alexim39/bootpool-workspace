import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { NotificationService, AppNotification } from '../../core/services';
import { DeviceService } from '../../core/services';
import { AppNavComponent, MobileNavComponent } from '../../core/components';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [RouterModule, FormsModule, DatePipe, MatIconModule, MatButtonModule, MatTooltipModule, AppNavComponent, MobileNavComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifService = inject(NotificationService);
  device = inject(DeviceService);
  private router = inject(Router);

  page = signal(1);
  limit = signal(20);
  loading = signal(false);
  total = signal(0);
  totalPages = signal(1);
  unreadTotal = signal(0);
  notifications = signal<AppNotification[]>([]);

  search = signal('');
  typeFilter = signal('');
  readFilter = signal('');
  dateFrom = signal('');
  dateTo = signal('');
  sortField = signal('createdAt');
  sortOrder = signal<'asc' | 'desc'>('desc');

  selectedIds = signal<Set<string>>(new Set());
  bulkDeleting = signal(false);
  bulkMarking = signal(false);
  armedDelete = signal(false);

  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();
  private armTimer: ReturnType<typeof setTimeout> | null = null;

  Math = Math;
  skeletonItems = Array.from({ length: 8 }, (_, i) => i);

  readonly PAGE_SIZES = [20, 50, 100];

  readonly SORT_OPTIONS = [
    { value: 'createdAt:desc', label: 'Newest first' },
    { value: 'createdAt:asc', label: 'Oldest first' },
    { value: 'title:asc', label: 'Title A–Z' },
    { value: 'title:desc', label: 'Title Z–A' },
    { value: 'type:asc', label: 'Type A–Z' }
  ];

  hasSelection = computed(() => this.selectedIds().size > 0);
  selectedCount = computed(() => this.selectedIds().size);
  allSelected = computed(() => this.notifications().length > 0 && this.selectedIds().size === this.notifications().length);
  someSelected = computed(() => this.selectedIds().size > 0 && this.selectedIds().size < this.notifications().length);
  readTotal = computed(() => Math.max(0, this.total() - this.unreadTotal()));
  currentSort = computed(() => `${this.sortField()}:${this.sortOrder()}`);
  unreadSelected = computed(() => this.notifications().filter(n => this.selectedIds().has(n._id) && !n.read).length);
  activeFilterCount = computed(() =>
    (this.search() ? 1 : 0) +
    (this.typeFilter() ? 1 : 0) +
    (this.readFilter() ? 1 : 0) +
    (this.dateFrom() ? 1 : 0) +
    (this.dateTo() ? 1 : 0)
  );

  readonly NOTIF_TYPES = ['deposit', 'withdrawal', 'stake', 'payout', 'referral', 'kyc', 'auth', 'system'];

  ngOnInit() {
    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.page.set(1);
      this.load();
    });
    this.load();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.armTimer) clearTimeout(this.armTimer);
  }

  load() {
    this.loading.set(true);
    const filters: any = {};
    if (this.typeFilter()) filters.type = this.typeFilter();
    if (this.readFilter()) filters.read = this.readFilter();
    if (this.dateFrom()) filters.from = this.dateFrom();
    if (this.dateTo()) filters.to = this.dateTo();
    if (this.search()) filters.search = this.search();
    filters.sortField = this.sortField();
    filters.sortOrder = this.sortOrder();

    this.notifService.fetchNotifications(this.page(), this.limit(), filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notifications.set(res.data.notifications);
          this.total.set(res.data.total);
          this.totalPages.set(res.data.pages);
          this.unreadTotal.set(res.data.unreadCount);
          this.selectedIds.set(new Set());
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearchInput(value: string) {
    this.search.set(value);
    this.search$.next(value);
  }

  clearSearch() {
    this.search.set('');
    this.search$.next('');
  }

  onSortChange(value: string) {
    const [field, order] = value.split(':');
    this.sortField.set(field);
    this.sortOrder.set(order as 'asc' | 'desc');
    this.page.set(1);
    this.load();
  }

  onPageSizeChange(size: number) {
    this.limit.set(size);
    this.page.set(1);
    this.load();
  }

  onFilterChange() {
    this.page.set(1);
    this.load();
  }

  clearFilters() {
    this.typeFilter.set('');
    this.readFilter.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.clearSearch();
    this.sortField.set('createdAt');
    this.sortOrder.set('desc');
    this.page.set(1);
    this.load();
  }

  hasActiveFilters(): boolean {
    return this.activeFilterCount() > 0;
  }

  toggleSelect(id: string) {
    this.selectedIds.update(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleSelectAll() {
    this.selectedIds.update(s => {
      if (s.size === this.notifications().length) return new Set();
      return new Set(this.notifications().map(n => n._id));
    });
  }

  armBulkDelete() {
    if (this.armedDelete()) {
      this.bulkDelete();
      return;
    }
    this.armedDelete.set(true);
    if (this.armTimer) clearTimeout(this.armTimer);
    this.armTimer = setTimeout(() => this.armedDelete.set(false), 3000);
  }

  bulkDelete() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;
    this.bulkDeleting.set(true);
    this.notifService.bulkDelete(ids).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.notifications.update(n => n.filter(x => !ids.includes(x._id)));
        this.notifService.notifications.update(n => n.filter(x => !ids.includes(x._id)));
        const removedUnread = this.notifService.notifications().filter(x => ids.includes(x._id) && !x.read).length;
        this.notifService.unreadCount.update(c => Math.max(0, c - removedUnread));
        this.unreadTotal.update(c => Math.max(0, c - removedUnread));
        this.selectedIds.set(new Set());
        this.total.update(t => t - ids.length);
        this.totalPages.set(Math.ceil(this.total() / this.limit()));
        this.bulkDeleting.set(false);
        this.armedDelete.set(false);
      },
      error: () => {
        this.bulkDeleting.set(false);
        this.armedDelete.set(false);
      }
    });
  }

  bulkMarkRead() {
    const ids = Array.from(this.selectedIds());
    const selected = this.notifications().filter(n => ids.includes(n._id) && !n.read).length;
    if (ids.length === 0 || selected === 0) return;
    this.bulkMarking.set(true);
    this.notifService.bulkMarkAsRead(ids).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notifications.update(n => n.map(x => ids.includes(x._id) ? { ...x, read: true } : x));
        this.notifService.notifications.update(n => n.map(x => ids.includes(x._id) ? { ...x, read: true } : x));
        this.notifService.unreadCount.update(c => Math.max(0, c - selected));
        this.unreadTotal.update(c => Math.max(0, c - selected));
        this.selectedIds.set(new Set());
        this.bulkMarking.set(false);
      },
      error: () => this.bulkMarking.set(false)
    });
  }

  bulkMarkUnread() {
    const ids = Array.from(this.selectedIds());
    const selected = this.notifications().filter(n => ids.includes(n._id) && n.read).length;
    if (ids.length === 0 || selected === 0) return;
    this.bulkMarking.set(true);
    this.notifService.bulkMarkAsUnread(ids).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notifications.update(n => n.map(x => ids.includes(x._id) ? { ...x, read: false } : x));
        this.notifService.notifications.update(n => n.map(x => ids.includes(x._id) ? { ...x, read: false } : x));
        this.notifService.unreadCount.update(c => c + selected);
        this.unreadTotal.update(c => c + selected);
        this.selectedIds.set(new Set());
        this.bulkMarking.set(false);
      },
      error: () => this.bulkMarking.set(false)
    });
  }

  openNotification(n: AppNotification) {
    const data = n.data || {};
    if (data['podId']) {
      this.router.navigate(['/home'], { queryParams: { pod: data['podId'] } });
      return;
    }
    if (data['coaching'] || data['cashback']) {
      this.router.navigate(['/profile']);
      return;
    }
    if (!n.read) this.markRead(n._id);
  }

  markRead(id: string) {
    this.notifService.markAsRead(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notifications.update(n => n.map(x => x._id === id ? { ...x, read: true } : x));
        this.notifService.notifications.update(n => n.map(x => x._id === id ? { ...x, read: true } : x));
        this.notifService.unreadCount.update(c => Math.max(0, c - 1));
        this.unreadTotal.update(c => Math.max(0, c - 1));
      },
      error: () => {}
    });
  }

  markUnread(id: string) {
    this.notifService.markAsUnread(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notifications.update(n => n.map(x => x._id === id ? { ...x, read: false } : x));
        this.notifService.notifications.update(n => n.map(x => x._id === id ? { ...x, read: false } : x));
        this.notifService.unreadCount.update(c => c + 1);
        this.unreadTotal.update(c => c + 1);
      },
      error: () => {}
    });
  }

  deleteSingle(id: string) {
    this.notifService.deleteNotification(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notifications.update(n => n.filter(x => x._id !== id));
        this.notifService.notifications.update(n => n.filter(x => x._id !== id));
        const removed = this.notifService.notifications().find(x => x._id === id && !x.read);
        if (removed) {
          this.notifService.unreadCount.update(c => Math.max(0, c - 1));
          this.unreadTotal.update(c => Math.max(0, c - 1));
        }
        this.total.update(t => t - 1);
        this.totalPages.set(Math.ceil(this.total() / this.limit()));
        this.selectedIds.update(s => { const n = new Set(s); n.delete(id); return n; });
      },
      error: () => {}
    });
  }

  markAllRead() {
    this.notifService.markAllAsRead().pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notifications.update(n => n.map(x => ({ ...x, read: true })));
        this.notifService.notifications.update(n => n.map(x => ({ ...x, read: true })));
        this.notifService.unreadCount.set(0);
        this.unreadTotal.set(0);
      },
      error: () => {}
    });
  }

  getPageRange(): number[] {
    const total = this.totalPages();
    const current = this.page();
    const range: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  clearSelection() {
    this.selectedIds.set(new Set());
    this.armedDelete.set(false);
    if (this.armTimer) clearTimeout(this.armTimer);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.load();
  }
}
