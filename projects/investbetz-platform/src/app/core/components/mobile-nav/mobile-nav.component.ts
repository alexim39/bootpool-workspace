import { Component, inject, computed, signal, DestroyRef, ElementRef, HostListener, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService, WalletService, StakeService, NotificationService } from '../../services';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatBadgeModule],
  templateUrl: './mobile-nav.component.html',
  styleUrls: ['./mobile-nav.component.scss']
})
export class MobileNavComponent implements OnInit {
  private stakeService = inject(StakeService);
  private walletService = inject(WalletService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private elementRef = inject(ElementRef);
  auth = inject(AuthService);
  notifService = inject(NotificationService);

  activeBetsCount = computed(() => this.stakeService.activeStakes().length);
  walletBalance = computed(() => this.walletService.balance().available || 0);

  playSheetOpen = signal(false);
  accountSheetOpen = signal(false);
  playActive = signal(false);
  accountActive = signal(false);

  hasFetched = false;

  userInitial = computed(() => {
    const name = this.auth.user()?.fullName?.trim();
    return name ? name.charAt(0).toUpperCase() : 'U';
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
    this.playActive.set(
      url.startsWith('/leaderboard') ||
      url.startsWith('/virtual-games') ||
      url.startsWith('/match-pools') ||
      url.startsWith('/bet-manager')
    );
    this.accountActive.set(url.startsWith('/wallet') || url.startsWith('/profile'));
  }

  togglePlaySheet() {
    this.playSheetOpen.update((v) => !v);
    this.accountSheetOpen.set(false);
  }

  toggleAccountSheet() {
    this.accountSheetOpen.update((v) => !v);
    this.playSheetOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.playSheetOpen.set(false);
      this.accountSheetOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.playSheetOpen.set(false);
    this.accountSheetOpen.set(false);
  }

  formatMoney(amount: number): string {
    return '₦' + amount.toLocaleString('en-US');
  }

  ngOnInit() {
    if (!this.hasFetched) {
      this.notifService.fetchNotifications(1, 20).subscribe({ error: () => {} });
      this.hasFetched = true;
    }
  }
}
