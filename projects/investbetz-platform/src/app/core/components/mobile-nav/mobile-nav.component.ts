import { Component, inject, computed, OnInit } from '@angular/core';
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

  activeBetsCount = computed(() => this.stakeService.activeStakes().length);
  hasFetched = false;

  ngOnInit() {
    if (!this.hasFetched) {
      this.notifService.fetchNotifications(1, 20).subscribe({ error: () => {} });
      this.hasFetched = true;
    }
  }
}
