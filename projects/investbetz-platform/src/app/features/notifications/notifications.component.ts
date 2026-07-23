import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService, AppNotification } from '../../core/services';
import { DeviceService } from '../../core/services';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
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
