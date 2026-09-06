import { Component, Output, EventEmitter, input, signal, computed, inject, effect, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Pod } from '../../../../core/services';
import { SocialFeedService } from '../../../../core/services';
import { HomeStore } from '../../stores/home.store';

@Component({
  selector: 'app-swipe-deck',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, MatSnackBarModule, MatProgressSpinnerModule],
  templateUrl: './swipe-deck.component.html',
  styleUrls: ['./swipe-deck.component.scss']
})
export class SwipeDeckComponent implements AfterViewInit, OnDestroy {
  pods = input.required<Pod[]>();
  selectedIds = input<string[]>([]);
  selectionDisabled = input(false);
  hasMore = input(false);
  loadingMore = input(false);
  @Output() placeStake = new EventEmitter<Pod>();
  @Output() toggleSelect = new EventEmitter<Pod>();
  @Output() loadMore = new EventEmitter<void>();

  private snackBar = inject(MatSnackBar);
  private el = inject(ElementRef);
  private router = inject(Router);
  readonly socialFeed = inject(SocialFeedService);
  readonly store = inject(HomeStore);

  private nowTimer: ReturnType<typeof setInterval> | undefined;

  readonly index = signal(0);
  readonly dragOffset = signal(0);
  readonly dragging = signal(false);
  readonly searchOpen = signal(false);
  readonly hasSwiped = signal(false);
  // Big-heart burst overlay for double-tap-to-like (TikTok-style).
  readonly heart = signal<{ podId: string; n: number } | null>(null);
  private heartSeq = 0;

  // Full-screen feed: every card is exactly one viewport tall (TikTok-style
  // paging). No content measuring — the card layout flexes to fill the space.
  readonly viewportH = signal(typeof window !== 'undefined' ? window.innerHeight : 800);
  private lastFirstId = '';
  private readonly destroyFns: (() => void)[] = [];

  readonly progressPct = computed(() => {
    const total = this.pods().length;
    if (!total) return 0;
    return Math.min(100, ((this.index() + 1) / total) * 100);
  });

  constructor() {
    effect(() => {
      const pods = this.pods();
      const first = pods[0]?.id ?? '';
      if (first !== this.lastFirstId) {
        this.lastFirstId = first;
        this.index.set(0);
        this.dragOffset.set(0);
      }
    });
  }

  ngAfterViewInit() {
    this.nowTimer = setInterval(() => {
      const host = this.el.nativeElement as HTMLElement;
      const ticks = host.querySelectorAll<HTMLElement>('.closes-tick');
      if (ticks.length === 0) return;
      const pods = this.pods();
      const now = Date.now();
      for (let i = 0; i < ticks.length; i++) {
        const id = ticks[i].getAttribute('data-pod');
        const pod = id ? pods.find(p => p.id === id) : null;
        if (pod) {
          ticks[i].textContent = ' ' + this.countdown(Math.max(0, new Date(pod.stakingClosesAt).getTime() - now));
        }
      }
    }, 1000);
    // The deck is a fixed full-screen overlay: lock the page behind it.
    this.updateViewportH();
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
    const vv = (window as any).visualViewport;
    window.addEventListener('resize', this.updateViewportH);
    window.addEventListener('orientationchange', this.updateViewportH);
    if (vv) vv.addEventListener('resize', this.updateViewportH);
    this.destroyFns.push(() => {
      window.removeEventListener('resize', this.updateViewportH);
      window.removeEventListener('orientationchange', this.updateViewportH);
      if (vv) vv.removeEventListener('resize', this.updateViewportH);
    });
  }

  ngOnDestroy() {
    if (this.nowTimer) clearInterval(this.nowTimer);
    this.destroyFns.forEach(fn => fn());
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  private updateViewportH = () => {
    const vv = (window as any).visualViewport;
    const h = Math.round(vv?.height || window.innerHeight || 800);
    if (h > 0) this.viewportH.set(h);
  };

  readonly current = computed(() => this.pods()[this.index()] ?? null);

  readonly atEnd = computed(() => {
    return this.index() >= this.pods().length - 1;
  });

  isSelected(pod: Pod): boolean {
    return this.selectedIds().includes(pod.id);
  }

  next() {
    if (this.atEnd()) {
      if (this.hasMore()) this.loadMore.emit();
      return;
    }
    this.hasSwiped.set(true);
    this.index.update(i => i + 1);
    this.dragOffset.set(0);
  }

  prev() {
    if (this.index() <= 0) return;
    this.index.update(i => i - 1);
    this.dragOffset.set(0);
  }

  cardTop(i: number): number {
    return (i - this.index()) * this.viewportH();
  }

  // ----- feed chrome (tabs / search / create) -----
  setMode(mode: 'foryou' | 'following' | 'saved') {
    this.store.setFeedMode(mode);
  }

  toggleSearch() {
    this.searchOpen.update(v => !v);
  }

  onSearchInput(value: string) {
    this.store.onSearchInput(value);
  }

  clearSearch() {
    this.store.clearSearch();
  }

  openBuildCode() {
    if (!this.store.auth.isAuthenticated()) {
      this.snackBar.open('Please log in to create a booking code', 'OK', { duration: 3000 });
      return;
    }
    this.store.openBuildCode();
  }

  visible(i: number): boolean {
    return i >= this.index() - 1 && i <= this.index() + 1;
  }

  // ----- gestures -----
  private startY = 0;
  private moved = false;
  private tapX = 0;
  private tapY = 0;
  private tapIsInteractive = false;
  private lastTapTime = 0;
  private lastTapX = 0;
  private lastTapY = 0;
  private static readonly DOUBLE_TAP_MS = 320;
  private static readonly DOUBLE_TAP_PX = 48;

  onTouchStart(e: TouchEvent) {
    this.startY = e.touches[0].clientY;
    this.moved = false;
    this.dragging.set(true);
    // Double-tap must never fire from buttons/inputs/tabs (e.g. double-tapping
    // Stake must not like) nor from multi-touch.
    if (e.touches.length > 1) {
      this.tapIsInteractive = true;
      return;
    }
    this.tapX = e.touches[0].clientX;
    this.tapY = e.touches[0].clientY;
    const t = e.target as HTMLElement | null;
    this.tapIsInteractive = !!t?.closest?.('button, a, input, textarea, select, [role="tab"]');
  }

  onTouchMove(e: TouchEvent) {
    const delta = e.touches[0].clientY - this.startY;
    if (Math.abs(delta) < 4) return;
    this.moved = true;
    this.dragOffset.set(delta);
  }

  onTouchEnd() {
    this.dragging.set(false);
    const delta = this.dragOffset();
    // A clean tap (no drag, not on a control) feeds double-tap detection.
    if (!this.moved && !this.tapIsInteractive) this.handleTap();
    if (delta < -60) this.next();
    else if (delta > 60) this.prev();
    else this.dragOffset.set(0);
    this.moved = false;
  }

  private handleTap() {
    const now = Date.now();
    const dt = now - this.lastTapTime;
    const dist = Math.hypot(this.tapX - this.lastTapX, this.tapY - this.lastTapY);
    if (dt < SwipeDeckComponent.DOUBLE_TAP_MS && dist < SwipeDeckComponent.DOUBLE_TAP_PX) {
      this.lastTapTime = 0;
      this.doubleTapLike();
    } else {
      this.lastTapTime = now;
      this.lastTapX = this.tapX;
      this.lastTapY = this.tapY;
    }
  }

  /** Desktop fallback for verification (mobile uses touch). */
  onCardDblClick(e: MouseEvent) {
    const t = e.target as HTMLElement | null;
    if (t?.closest?.('button, a, input, textarea, select, [role="tab"]')) return;
    this.doubleTapLike();
  }

  private doubleTapLike() {
    const pod = this.current();
    if (!pod) return;
    // Restart the burst animation even on rapid repeats: destroy then recreate.
    const n = ++this.heartSeq;
    this.heart.set(null);
    setTimeout(() => {
      if (this.heartSeq !== n) return;
      this.heart.set({ podId: pod.id, n });
      setTimeout(() => {
        if (this.heartSeq === n) this.heart.set(null);
      }, 950);
    }, 30);
    // TikTok semantics: double-tap ensures liked, never unlikes.
    if (!this.socialFeed.isLiked(pod.id)) this.toggleLike(pod);
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') { this.next(); }
    else if (e.key === 'ArrowUp') { this.prev(); }
  }

  // ----- social -----
  toggleLike(pod: Pod) {
    this.socialFeed.toggleLike(pod.id).catch(() => {
      this.snackBar.open('Could not update like — try again', 'OK', { duration: 2500 });
    });
  }

  toggleSave(pod: Pod) {
    this.socialFeed.toggleSave(pod.id).catch(() => {
      this.snackBar.open('Could not update save — try again', 'OK', { duration: 2500 });
    });
  }

  openCreator(pod: Pod) {
    this.router.navigate(['/social', this.socialFeed.creatorOf(pod)]);
  }

  isFollowing(pod: Pod): boolean {
    return this.socialFeed.isFollowing(this.socialFeed.creatorOf(pod));
  }

  isOraOf(pod: Pod): boolean {
    return this.socialFeed.isOraCreator(this.socialFeed.creatorOf(pod));
  }

  isMyPodOf(pod: Pod): boolean {
    return this.socialFeed.isMyPod(pod);
  }

  creatorNameOf(pod: Pod): string {
    return this.socialFeed.creatorNameFor(pod);
  }

  toggleFollow(pod: Pod) {
    this.socialFeed.toggleFollow(this.socialFeed.creatorOf(pod)).then(msg => {
      if (msg) this.snackBar.open(msg, 'OK', { duration: 2500 });
    }).catch(() => {
      this.snackBar.open('Could not update follow — try again', 'OK', { duration: 2500 });
    });
  }

  async share(pod: Pod) {
    const msg = await this.socialFeed.sharePod(pod);
    if (msg) this.snackBar.open(msg, 'OK', { duration: 2500 });
  }

  stake(pod: Pod) {
    this.placeStake.emit(pod);
  }

  select(pod: Pod) {
    this.toggleSelect.emit(pod);
  }

  formatMoney(n: number): string {
    return '₦' + Math.round(n).toLocaleString();
  }

  kickoffLabel(pod: Pod): string {
    const d = new Date(pod.matchDate || pod.stakingClosesAt);
    const now = Date.now();
    const diff = d.getTime() - now;
    if (diff < 0) return 'Opens soon';
    if (diff < 3600000) return `Starts in ${Math.max(1, Math.round(diff / 60000))}m`;
    if (diff < 86400000) return `Starts in ${Math.round(diff / 3600000)}h`;
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  countdown(ms: number): string {
    if (ms <= 0) return 'Closed';
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    if (mins > 0 || hours > 0 || days > 0) parts.push(`${mins.toString().padStart(2, '0')}m`);
    parts.push(`${secs.toString().padStart(2, '0')}s`);
    return parts.join(' ');
  }

  confidence(pod: Pod): number {
    const ora = Number(pod.metadata?.['oraConfidence'] ?? 0);
    if (ora > 0) return Math.round(Math.min(100, Math.max(0, ora)));
    const imp = pod.impliedProbability || 0;
    if (imp > 0) return Math.round(Math.min(100, Math.max(0, imp * 100)));
    return 0;
  }

  exposurePct(pod: Pod): number {
    if (!pod.maxTotalExposure) return 0;
    return Math.min(100, Math.round((pod.currentExposure || 0) / pod.maxTotalExposure * 100));
  }
}
