import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService, AppNotification } from '../../core/services/notification.service';
import { DeviceService } from '../../core/services/device.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatButtonModule],
  template: `
    <div class="notif-page" [class.mobile]="device.isMobile()">
      <div class="notif-header">
        <a routerLink="/home" class="back-btn"><mat-icon>arrow_back</mat-icon></a>
        <h1>Notifications</h1>
        @if (notifService.notifications().length > 0) {
          <button class="mark-all-link" (click)="markAllRead()">Mark all read</button>
        }
      </div>

      <div class="notif-tabs">
        <button class="tab" [class.active]="filter() === 'all'" (click)="filter.set('all'); page.set(1); load()">All</button>
        <button class="tab" [class.active]="filter() === 'unread'" (click)="filter.set('unread'); page.set(1); load()">Unread</button>
      </div>

      <div class="notif-list">
        @if (loading() && notifications().length === 0) {
          <div class="state-msg"><mat-icon>hourglass_empty</mat-icon><span>Loading...</span></div>
        } @else if (notifications().length === 0) {
          <div class="state-msg"><mat-icon>notifications_none</mat-icon><span>No notifications</span></div>
        }
        @for (notif of notifications(); track notif._id) {
          <div class="notif-item" [class.unread]="!notif.read" [class.mobile]="device.isMobile()">
            <div class="notif-left">
              <div class="notif-icon" [style.--notif-color]="notifService.getNotificationColor(notif.type)">
                <mat-icon>{{ notifService.getNotificationIcon(notif.type) }}</mat-icon>
              </div>
            </div>
            <div class="notif-body">
              <div class="notif-title">{{ notif.title }}</div>
              <div class="notif-message">{{ notif.message }}</div>
              <div class="notif-time">{{ notifService.timeAgo(notif.createdAt) }}</div>
            </div>
            <div class="notif-actions">
              @if (notif.read) {
                <button class="action-btn" (click)="markUnread(notif._id)" matTooltip="Mark unread"><mat-icon>mark_email_unread</mat-icon></button>
              } @else {
                <button class="action-btn" (click)="markRead(notif._id)" matTooltip="Mark read"><mat-icon>done</mat-icon></button>
              }
              <button class="action-btn delete" (click)="deleteNotif(notif._id)" matTooltip="Delete"><mat-icon>delete</mat-icon></button>
            </div>
          </div>
        }
      </div>

      @if (totalPages() > 1) {
        <div class="pagination">
          <button class="page-btn" [disabled]="page() <= 1" (click)="page.set(page() - 1); load()"><mat-icon>chevron_left</mat-icon></button>
          <span class="page-info">{{ page() }} / {{ totalPages() }}</span>
          <button class="page-btn" [disabled]="page() >= totalPages()" (click)="page.set(page() + 1); load()"><mat-icon>chevron_right</mat-icon></button>
        </div>
      }
    </div>
  `,
  styles: [`
    .notif-page { max-width: 720px; margin: 0 auto; padding: 24px 16px 100px; }
    .notif-page.mobile { padding: 0 0 80px; }
    .notif-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .notif-page.mobile .notif-header { padding: 12px 16px; margin-bottom: 0; background: rgba(10,20,40,0.95); position: sticky; top: 0; z-index: 10; }
    .back-btn { color: rgba(255,255,255,0.5); text-decoration: none; display: flex; }
    .back-btn:hover { color: #fff; }
    .notif-header h1 { font-size: 20px; font-weight: 700; color: #fff; margin: 0; flex: 1; }
    .mark-all-link { background: none; border: none; color: #00E676; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }

    .notif-tabs { display: flex; gap: 4px; margin-bottom: 16px; background: rgba(255,255,255,0.03); border-radius: 10px; padding: 3px; }
    .notif-page.mobile .notif-tabs { margin: 12px 16px; }
    .tab { flex: 1; padding: 8px; border: none; border-radius: 8px; background: transparent; color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .tab.active { background: rgba(0,230,118,0.12); color: #00E676; }

    .notif-list { display: flex; flex-direction: column; gap: 1px; }
    .state-msg { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: rgba(255,255,255,0.3); gap: 8px; }
    .state-msg mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .state-msg span { font-size: 13px; }

    .notif-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: rgba(255,255,255,0.02); border-radius: 10px; transition: background 0.15s; }
    .notif-item.mobile { border-radius: 0; padding: 14px 16px; }
    .notif-item.unread { background: rgba(0,230,118,0.03); }
    .notif-item + .notif-item { margin-top: 1px; }
    .notif-icon { width: 36px; height: 36px; border-radius: 10px; background: color-mix(in srgb, var(--notif-color) 15%, transparent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .notif-icon mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--notif-color); }
    .notif-body { flex: 1; min-width: 0; }
    .notif-title { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 2px; }
    .notif-message { font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .notif-time { font-size: 10.5px; color: rgba(255,255,255,0.3); margin-top: 4px; }
    .notif-actions { display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }
    .action-btn { background: rgba(255,255,255,0.04); border: none; color: rgba(255,255,255,0.3); cursor: pointer; width: 30px; height: 30px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
    .action-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .action-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .action-btn.delete:hover { background: rgba(244,67,54,0.12); color: #f44336; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 20px; }
    .page-btn { background: rgba(255,255,255,0.04); border: none; color: rgba(255,255,255,0.5); cursor: pointer; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .page-btn:disabled { opacity: 0.3; cursor: default; }
    .page-btn:hover:not(:disabled) { background: rgba(255,255,255,0.08); color: #fff; }
    .page-info { font-size: 13px; color: rgba(255,255,255,0.4); }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifService = inject(NotificationService);
  device = inject(DeviceService);

  filter = signal<'all' | 'unread'>('all');
  page = signal(1);
  loading = signal(false);
  totalPages = signal(1);

  notifications = signal<AppNotification[]>([]);

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.load();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load() {
    this.loading.set(true);
    this.notifService.fetchNotifications(this.page(), 20).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.success) {
          let items = res.data.notifications;
          if (this.filter() === 'unread') {
            items = items.filter((n: AppNotification) => !n.read);
          }
          this.notifications.set(items);
          this.totalPages.set(res.data.pages);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  markRead(id: string) {
    this.notifService.markAsRead(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notifications.update(n => n.map(x => x._id === id ? { ...x, read: true } : x));
        this.notifService.notifications.update(n => n.map(x => x._id === id ? { ...x, read: true } : x));
        this.notifService.unreadCount.update(c => Math.max(0, c - 1));
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
      },
      error: () => {}
    });
  }

  deleteNotif(id: string) {
    this.notifService.deleteNotification(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notifications.update(n => n.filter(x => x._id !== id));
        this.notifService.notifications.update(n => n.filter(x => x._id !== id));
        this.notifService.unreadCount.update(c => Math.max(0, c - (this.notifService.notifications().find(x => x._id === id && !x.read) ? 1 : 0)));
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
      },
      error: () => {}
    });
  }
}
