import { Component, inject, computed, signal, OnInit, HostListener, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../services';
import { StakeService } from '../../services';
import { NotificationService } from '../../services';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatBadgeModule],
  templateUrl: './mobile-nav.component.html',
  styleUrls: ['./mobile-nav.component.scss']
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
