import { Component, OnInit, signal, inject, computed, ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { Pod } from '../../../../core/services';
import { NotificationService } from '../../../../core/services';
import { OraPick } from '../../../../core/services';
import { PodCardComponent } from '../../components/pod-card/pod-card.component';
import { StakeModalComponent } from '../../components/stake-modal/stake-modal.component';
import { BetSlipComponent } from '../../components/bet-slip/bet-slip.component';
import { FeaturedBannerComponent } from '../../components/featured-banner/featured-banner.component';
import { StoriesRailComponent } from '../../components/stories-rail/stories-rail.component';
import { SwipeDeckComponent } from '../../components/swipe-deck/swipe-deck.component';
import { WhoToFollowComponent } from '../../components/who-to-follow/who-to-follow.component';
import { CodePostCardComponent } from '../../components/code-post-card/code-post-card.component';
import { BuildCodeDialogComponent } from '../../components/build-code-dialog/build-code-dialog.component';
import { CommentsSheetComponent } from '../../components/comments-sheet/comments-sheet.component';
import { TopUpModalComponent, OraChatComponent, OraPickBannerComponent } from '../../../../core/components';
import { MobileNavComponent } from '../../../../core/components';
import { HomeStore } from '../../stores/home.store';

@Component({
  selector: 'app-home-mobile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatBadgeModule,
    PodCardComponent,
    StakeModalComponent,
    BetSlipComponent,
    FeaturedBannerComponent,
    StoriesRailComponent,
    SwipeDeckComponent,
    WhoToFollowComponent,
    CodePostCardComponent,
    BuildCodeDialogComponent,
    CommentsSheetComponent,
    TopUpModalComponent,
    MobileNavComponent,
    OraChatComponent,
    OraPickBannerComponent
  ],
  templateUrl: './home-mobile.component.html',
  styleUrls: ['./home-mobile.component.scss']
})
export class HomeMobileComponent implements OnInit, AfterViewInit, OnDestroy {
  private _snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  readonly store = inject(HomeStore);
  readonly notifService = inject(NotificationService);

  @ViewChild('feedSentinel') feedSentinel?: ElementRef<HTMLDivElement>;
  @ViewChild(SwipeDeckComponent, { read: ElementRef }) deckEl?: ElementRef<HTMLElement>;
  private feedObserver?: IntersectionObserver;
  private immersiveRaf = false;
  private readonly immersiveFns: (() => void)[] = [];

  readonly immersive = signal(false);

  private onDeckScroll = () => {
    if (this.immersiveRaf) return;
    this.immersiveRaf = true;
    requestAnimationFrame(() => {
      this.immersiveRaf = false;
      const deck = this.deckEl?.nativeElement;
      if (!deck || !deck.isConnected) {
        if (this.immersive()) this.ngZone.run(() => this.immersive.set(false));
        return;
      }
      const rect = deck.getBoundingClientRect();
      const vh = window.innerHeight;
      const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      const fraction = rect.height > 0 ? visible / rect.height : 0;
      if (this.immersive()) {
        if (fraction <= 0.15) this.ngZone.run(() => this.immersive.set(false));
      } else if (fraction >= 0.4) {
        this.ngZone.run(() => this.immersive.set(true));
      }
    });
  };

  showTopUp = signal(false);
  showOraChat = signal(false);
  showNotifPanel = signal(false);
  readonly slipResult = signal<{ success: boolean; message?: string } | null>(null);
  readonly slipIds = computed(() => this.store.betSlipSelections().map(p => p.id));

  openOraChat() { this.showOraChat.set(true); }

  closeOraChat() { this.showOraChat.set(false); }

  toggleNotifPanel() {
    this.showNotifPanel.update(v => !v);
    if (this.showNotifPanel()) {
      this.notifService.fetchNotifications(1, 20).subscribe({ error: () => {} });
    }
  }

  closeNotifPanel() { this.showNotifPanel.set(false); }

  markNotifRead(id: string) {
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

  openNotif(notif: any) {
    this.markNotifRead(notif._id);
    const data = notif.data || {};
    if (data['podId']) {
      this.closeNotifPanel();
      this.store.openPodById(data['podId']);
    } else if (data['coaching'] || data['cashback']) {
      this.closeNotifPanel();
      this.router.navigate(['/profile']);
    }
  }

  markAllNotifRead() {
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

  ngOnInit() {
    this.store.init();
    const podId = this.route.snapshot.queryParamMap.get('pod');
    if (podId) this.store.openPodById(podId);
    const code = this.route.snapshot.queryParamMap.get('code');
    if (code && this.store.auth.isAuthenticated()) {
      this.store.redeemBookingCode(code).subscribe({ error: () => {} });
    }
  }

  ngAfterViewInit() {
    const el = this.feedSentinel?.nativeElement;
    if (el) {
      this.feedObserver = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) this.store.loadMore();
      }, { rootMargin: '600px 0px' });
      this.feedObserver.observe(el);
    }
    const onScroll = this.onDeckScroll;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    this.immersiveFns.push(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    });
  }

  ngOnDestroy() {
    this.feedObserver?.disconnect();
    this.immersiveFns.forEach(fn => fn());
  }

  openStakeModal(pod: Pod) {
    if (!this.store.auth.isAuthenticated()) {
      this._snackBar.open('Please log in to place a stake', 'OK', { duration: 3000 });
      return;
    }
    this.store.openStakeModal(pod);
  }

  onOraPickStake(pick: OraPick) {
    if (!this.store.auth.isAuthenticated()) {
      this._snackBar.open('Please log in to place a stake', 'OK', { duration: 3000 });
      return;
    }
    this.store.openPodById(pick.podId);
  }

  openLivePod(pod: Pod) {
    if (!this.store.auth.isAuthenticated()) {
      this._snackBar.open('Please log in to place a stake', 'OK', { duration: 3000 });
      return;
    }
    if (this.store.isStakable(pod)) {
      this.store.openStakeModal(pod);
    } else {
      this.store.openPodById(pod.id);
    }
  }

  handleStoriesPick(pod: Pod) {
    this.openLivePod(pod);
  }

  setFeedMode(mode: 'foryou' | 'following' | 'saved') {
    this.store.setFeedMode(mode);
  }

  openBuildCode() {
    if (!this.store.auth.isAuthenticated()) {
      this._snackBar.open('Please log in to create a booking code', 'OK', { duration: 3000 });
      return;
    }
    this.store.openBuildCode();
  }

  onCodeShared() {
    this.store.onCodeShared();
    this._snackBar.open('Booking code shared! It now shows in your Following feed', 'OK', { duration: 3500 });
  }

  onStakePlaced() {
    this.store.onStakePlaced();
    this._snackBar.open('Stake placed successfully!', 'OK', { duration: 2000 });
  }

  toggleSelection(pod: Pod) {
    if (!this.store.auth.isAuthenticated()) {
      this._snackBar.open('Please log in to place a stake', 'OK', { duration: 3000 });
      return;
    }
    if (this.store.betSlipSelections().length >= this.store.maxAccumulatorLegs() && !this.store.isSelected(pod.id)) {
      this._snackBar.open(`Maximum of ${this.store.maxAccumulatorLegs()} selections allowed`, 'OK', { duration: 2000 });
      return;
    }
    this.store.toggleSelection(pod);
  }

  onPlaceAccumulator(data: { podIds: string[]; stakeAmount: number }) {
    this.store.placeAccumulator(data).subscribe({
      next: (res) => {
        if (res.success) {
          this.store.clearSelections();
          this.store.onStakePlaced();
          this._snackBar.open('Accumulator placed successfully!', 'OK', { duration: 3000, verticalPosition: 'top' });
        } else {
          this._snackBar.open(res.message || 'Failed to place accumulator', 'OK', { duration: 3000, verticalPosition: 'top' });
        }
        this.slipResult.set({ success: res.success, message: res.message });
      },
      error: (err) => {
        this._snackBar.open(err.error?.message || 'Failed to place accumulator', 'OK', { duration: 3000, verticalPosition: 'top' });
        this.slipResult.set({ success: false, message: err.error?.message });
      }
    });
  }

  closeSlip() { this.store.betSlipOpen.set(false); }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
