import { Component, inject, signal, computed, HostListener, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../services/notification.service';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatBadgeModule, MatButtonModule],
  template: `
    <div class="notification-bell" #container>
      <button mat-icon-button class="bell-btn" (click)="togglePanel()" [matBadge]="notifService.unreadCount()" matBadgeColor="warn">
        <mat-icon>notifications</mat-icon>
      </button>

      @if (showPanel()) {
        <div class="notification-panel" (click)="stopProp($event)">
          <div class="panel-header">
            <span class="panel-title">Notifications</span>
            @if (notifService.unreadCount() > 0) {
              <button class="mark-all-btn" (click)="markAllRead()">Mark all read</button>
            }
          </div>
          <div class="panel-body">
            @if (notifService.notifications().length === 0) {
              <div class="empty-state">
                <mat-icon>notifications_none</mat-icon>
                <span>No notifications yet</span>
              </div>
            }
            @for (notif of notifService.notifications(); track notif._id) {
              <div class="notif-item" [class.unread]="!notif.read" (click)="markRead(notif._id)">
                <div class="notif-icon" [style.--notif-color]="notifService.getNotificationColor(notif.type)">
                  <mat-icon>{{ notifService.getNotificationIcon(notif.type) }}</mat-icon>
                </div>
                <div class="notif-content">
                  <div class="notif-title">{{ notif.title }}</div>
                  <div class="notif-message">{{ notif.message }}</div>
                  <div class="notif-time">{{ notifService.timeAgo(notif.createdAt) }}</div>
                </div>
                @if (!notif.read) {
                  <span class="unread-dot"></span>
                }
              </div>
            }
          </div>
          @if (notifService.notifications().length > 0) {
            <div class="panel-footer">
              <a routerLink="/notifications" class="view-all-link" (click)="showPanel.set(false)">View all notifications</a>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { position: relative; display: inline-flex; }
    .bell-btn {
      color: rgba(255,255,255,0.5) !important;
      transition: color 0.2s;
    }
    .bell-btn:hover { color: #fff !important; }
    ::ng-deep .mat-badge-content {
      font-size: 11px !important;
      font-weight: 800 !important;
      width: 20px !important;
      height: 20px !important;
      line-height: 20px !important;
    }
    .notification-panel {
      position: absolute;
      top: calc(100% + 8px);
      right: -60px;
      width: 360px;
      max-height: 420px;
      background: #0F1B30;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      overflow: hidden;
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .panel-title {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }
    .mark-all-btn {
      background: none;
      border: none;
      color: #00E676;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .mark-all-btn:hover {
      background: rgba(0,230,118,0.08);
    }
    .panel-body {
      overflow-y: auto;
      max-height: 320px;
      flex: 1;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      color: rgba(255,255,255,0.3);
      gap: 8px;
    }
    .empty-state mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
    }
    .empty-state span {
      font-size: 13px;
    }
    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.15s;
      position: relative;
    }
    .notif-item:hover {
      background: rgba(255,255,255,0.03);
    }
    .notif-item.unread {
      background: rgba(0,230,118,0.03);
    }
    .notif-item + .notif-item {
      border-top: 1px solid rgba(255,255,255,0.04);
    }
    .notif-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--notif-color) 15%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .notif-icon mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--notif-color);
    }
    .notif-content {
      flex: 1;
      min-width: 0;
    }
    .notif-title {
      font-size: 12.5px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 2px;
    }
    .notif-message {
      font-size: 11.5px;
      color: rgba(255,255,255,0.5);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .notif-time {
      font-size: 10.5px;
      color: rgba(255,255,255,0.3);
      margin-top: 4px;
    }
    .unread-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #00E676;
      flex-shrink: 0;
      margin-top: 6px;
    }
    .panel-footer {
      padding: 10px 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
      text-align: center;
    }
    .view-all-link {
      font-size: 12px;
      color: rgba(255,255,255,0.4);
      text-decoration: none;
    }
    .view-all-link:hover {
      color: #00E676;
    }
    @media (max-width: 768px) {
      .notification-panel {
        position: fixed;
        top: auto;
        right: 12px;
        left: 12px;
        width: auto;
        bottom: 80px;
        max-height: 60vh;
      }
    }
  `]
})
export class NotificationBellComponent {
  notifService = inject(NotificationService);
  device = inject(DeviceService);
  private elementRef = inject(ElementRef);

  showPanel = signal(false);
  hasFetched = false;

  ngOnInit() {
    if (!this.hasFetched) {
      this.notifService.fetchNotifications(1, 20).subscribe({
        error: () => {}
      });
      this.hasFetched = true;
    }
  }

  togglePanel() {
    this.showPanel.update(v => !v);
    if (this.showPanel() && !this.hasFetched) {
      this.notifService.fetchNotifications(1, 20).subscribe({
        error: () => {}
      });
      this.hasFetched = true;
    }
  }

  markRead(id: string) {
    this.notifService.markAsRead(id).subscribe({
      next: () => {
        this.notifService.notifications.update(n =>
          n.map(x => x._id === id ? { ...x, read: true } : x)
        );
        this.notifService.unreadCount.update(c => Math.max(0, c - 1));
      },
      error: () => {}
    });
  }

  markAllRead() {
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.notifService.notifications.update(n => n.map(x => ({ ...x, read: true })));
        this.notifService.unreadCount.set(0);
      }
    });
  }

  stopProp(e: Event) {
    e.stopPropagation();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent) {
    if (this.showPanel() && !this.elementRef.nativeElement.contains(event.target)) {
      this.showPanel.set(false);
    }
  }
}
