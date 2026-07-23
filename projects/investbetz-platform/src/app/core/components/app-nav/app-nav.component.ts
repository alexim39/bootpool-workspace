import { Component, inject, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services';
import { WalletService } from '../../services';
import { StakeService } from '../../services';
import { TopUpModalComponent, NotificationBellComponent } from '..';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatButtonModule, MatBadgeModule, MatTooltipModule, TopUpModalComponent, NotificationBellComponent],
  templateUrl: './app-nav.component.html',
  styleUrls: ['./app-nav.component.scss']
})
export class AppNavComponent {
  private walletService = inject(WalletService);
  private stakeService = inject(StakeService);
  auth = inject(AuthService);

  showTopUp = signal(false);

  walletBalance = computed(() => this.walletService.balance().available || 0);
  activeBetsCount = computed(() => this.stakeService.activeStakes().length);

  formatFull(amount: number): string {
    return '₦' + amount.toLocaleString('en-US');
  }

  formatAmount(amount: number): string {
    if (amount >= 1000000) return '₦' + (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return '₦' + (amount / 1000).toFixed(0) + 'K';
    return '₦' + amount;
  }
}
