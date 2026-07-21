import { Component, inject, computed, signal, OnInit, HostListener, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../services/auth.service';
import { StakeService } from '../../services/stake.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatBadgeModule],
  template: `
    <nav class="mobile-nav">
      <a routerLink="/home" routerLinkActive="active" class="nav-item" [routerLinkActiveOptions]="{ exact: true }">
        <mat-icon>home</mat-icon>
        <span class="nav-label">Home</span>
      </a>
      <a routerLink="/bets" routerLinkActive="active" class="nav-item" #rla2="routerLinkActive">
        <mat-icon [matBadge]="activeBetsCount() > 0 ? activeBetsCount() : null" matBadgeSize="medium">sports_esports</mat-icon>
        <span class="nav-label">Bets</span>
      </a>
      <a routerLink="/wallet" routerLinkActive="active" class="nav-item">
        <mat-icon>account_balance_wallet</mat-icon>
        <span class="nav-label">Wallet</span>
      </a>
      <a routerLink="/match-pools" routerLinkActive="active" class="nav-item">
        <mat-icon>pool</mat-icon>
        <span class="nav-label">Pools</span>
      </a>
      <button class="nav-item bell-trigger" (click)="togglePanel()">
        <mat-icon [matBadge]="notifService.unreadCount() > 0 ? notifService.unreadCount() : null" matBadgeSize="small">notifications</mat-icon>
        <span class="nav-label">Alerts</span>
      </button>
      <a routerLink="/profile" routerLinkActive="active" class="nav-item">
        <mat-icon>person</mat-icon>
        <span class="nav-label">Profile</span>
      </a>
    </nav>

    @if (showPanel()) {
      <div class="mobile-notif-backdrop" (click)="showPanel.set(false)">
        <div class="mobile-notif-sheet" (click)="stopProp($event)">
          <div class="panel-header">
            <span class="panel-title">Notifications</span>
            <div class="panel-header-actions">
              @if (notifService.unreadCount() > 0) {
                <button class="mark-all-btn" (click)="markAllRead()">Mark all read</button>
              }
              <button class="close-btn" (click)="showPanel.set(false)">
                <mat-icon>close</mat-icon>
              </button>
            </div>
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
      </div>
    }
  `,
  styles: [`
    :host { display: none; }
    @media (max-width: 768px) {
      :host { display: block; }
    }
    .mobile-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1001;
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: 60px;
      padding-bottom: env(safe-area-inset-bottom, 0);
      background: rgba(10, 20, 40, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: 4px 12px;
      text-decoration: none;
      color: rgba(255,255,255,0.4);
      transition: color 0.2s;
      min-width: 48px;
      position: relative;
    }
    .bell-trigger {
      background: none;
      border: none;
      cursor: pointer;
      font-family: inherit;
    }
    .nav-item.active {
      color: #00E676;
    }
    .nav-item mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .nav-label {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.2px;
    }

    .mobile-notif-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 300;
      background: rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .mobile-notif-sheet {
      background: #0F1B30;
      border-radius: 16px 16px 0 0;
      max-height: 60vh;
      display: flex;
      flex-direction: column;
      padding-bottom: 80px;
    }
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }
    .panel-header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .panel-title {
      font-size: 15px;
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
    .close-btn {
      background: rgba(255,255,255,0.05);
      border: none;
      color: rgba(255,255,255,0.4);
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .close-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .panel-body {
      overflow-y: auto;
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
      padding: 14px 20px;
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
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--notif-color) 15%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .notif-icon mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--notif-color);
    }
    .notif-content {
      flex: 1;
      min-width: 0;
    }
    .notif-title {
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 2px;
    }
    .notif-message {
      font-size: 12px;
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
      margin-top: 8px;
    }
    .panel-footer {
      padding: 10px 20px;
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
    ::ng-deep .mat-badge-content {
      font-size: 11px !important;
      background: #E8B923 !important;
      color: #0A1428 !important;
      font-weight: 800 !important;
      width: 20px !important;
      height: 20px !important;
      line-height: 20px !important;
    }
  `]
})
export class MobileNavComponent implements OnInit {
  private stakeService = inject(StakeService);
  auth = inject(AuthService);
  notifService = inject(NotificationService);
  private elementRef = inject(ElementRef);

  showPanel = signal(false);
  activeBetsCount = computed(() => this.stakeService.activeStakes().length);
  hasFetched = false;

  ngOnInit() {
    if (!this.hasFetched) {
      this.notifService.fetchNotifications(1, 20).subscribe({ error: () => {} });
      this.hasFetched = true;
    }
  }

  togglePanel() {
    this.showPanel.update(v => !v);
    if (this.showPanel()) {
      this.notifService.fetchNotifications(1, 20).subscribe({ error: () => {} });
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
