import { Component, inject, signal, computed, HostListener, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../services';
import { DeviceService } from '../../services';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatBadgeModule, MatButtonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
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
