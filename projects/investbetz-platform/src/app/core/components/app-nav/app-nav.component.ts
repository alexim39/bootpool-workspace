import { Component, inject, computed, signal, DestroyRef, ElementRef, HostListener } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services';
import { WalletService } from '../../services';
import { StakeService } from '../../services';
import { TopUpModalComponent } from '../top-up-modal/top-up-modal.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

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
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private elementRef = inject(ElementRef);
  auth = inject(AuthService);

  showTopUp = signal(false);
  playMenuOpen = signal(false);
  accountMenuOpen = signal(false);
  playActive = signal(false);
  accountActive = signal(false);

  walletBalance = computed(() => this.walletService.balance().available || 0);
  activeBetsCount = computed(() => this.stakeService.activeStakes().length);

  userInitial = computed(() => {
    const name = this.auth.user()?.fullName?.trim();
    return name ? name.charAt(0).toUpperCase() : 'U';
  });

  displayName = computed(() => {
    const name = this.auth.user()?.fullName?.trim();
    return name ? name.split(' ')[0] : 'Account';
  });

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.syncActiveRoutes());
    this.syncActiveRoutes();
  }

  private syncActiveRoutes() {
    const url = this.router.url;
    this.playActive.set(url.startsWith('/leaderboard') || url.startsWith('/virtual-games'));
    this.accountActive.set(url.startsWith('/wallet') || url.startsWith('/profile'));
  }

  togglePlayMenu() {
    this.playMenuOpen.update((v) => !v);
    this.accountMenuOpen.set(false);
  }

  toggleAccountMenu() {
    this.accountMenuOpen.update((v) => !v);
    this.playMenuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.playMenuOpen.set(false);
      this.accountMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.playMenuOpen.set(false);
    this.accountMenuOpen.set(false);
  }

  formatFull(amount: number): string {
    return '₦' + amount.toLocaleString('en-US');
  }

  formatAmount(amount: number): string {
    if (amount >= 1000000) return '₦' + (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return '₦' + (amount / 1000).toFixed(0) + 'K';
    return '₦' + amount;
  }
}
