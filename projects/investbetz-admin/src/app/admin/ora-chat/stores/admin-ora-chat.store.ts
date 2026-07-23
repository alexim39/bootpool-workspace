import { Injectable, inject, signal } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService, ChatSessionSummary, ChatSessionDetail, ChatStats } from '../../services';
import { PageEvent } from '@angular/material/paginator';

@Injectable({ providedIn: 'root' })
export class AdminOraChatStore {
  private adminService = inject(AdminService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  readonly sessions = signal<ChatSessionSummary[]>([]);
  readonly selectedSession = signal<ChatSessionDetail | null>(null);
  readonly selectedId = signal<string | null>(null);
  readonly stats = signal<ChatStats | null>(null);
  readonly loading = signal(false);
  readonly statusFilter = signal('');
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(15);
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadSessions();
    });
  }

  destroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStats() {
    this.adminService.getChatStats().pipe(takeUntil(this.destroy$)).subscribe({
      next: res => { if (res.success) this.stats.set(res.data); }
    });
  }

  loadSessions() {
    this.loading.set(true);
    this.adminService.getChatSessions({
      page: this.currentPage(),
      limit: this.pageSize(),
      status: this.statusFilter() || undefined,
      search: this.searchQuery() || undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        if (res.success) {
          this.sessions.set(res.data.sessions);
          this.totalItems.set(res.data.total);
          this.totalPages.set(res.data.pages);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  selectSession(id: string) {
    this.selectedId.set(id);
    this.selectedSession.set(null);
    this.adminService.getChatSession(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        if (res.success) this.selectedSession.set(res.data);
      }
    });
  }

  resolveSession() {
    const id = this.selectedId();
    if (!id) return;
    this.adminService.resolveChatSession(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        if (res.success) {
          this.selectedSession.update(s => s ? { ...s, status: 'resolved' as const } : null);
          this.loadStats();
          this.loadSessions();
        }
      }
    });
  }

  onSearchChange() {
    this.searchSubject.next(this.searchQuery());
  }

  onPageChange(e: PageEvent) {
    this.currentPage.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.loadSessions();
  }
}
