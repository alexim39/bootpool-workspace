import { Component, Output, EventEmitter, input, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Pod } from '../../../../core/services';
import { SocialFeedService } from '../../../../core/services';
import { PodCommentsComponent } from '../pod-comments/pod-comments.component';

@Component({
  selector: 'app-swipe-deck',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, MatSnackBarModule, MatProgressSpinnerModule, PodCommentsComponent],
  templateUrl: './swipe-deck.component.html',
  styleUrls: ['./swipe-deck.component.scss']
})
export class SwipeDeckComponent {
  pods = input.required<Pod[]>();
  selectedIds = input<string[]>([]);
  selectionDisabled = input(false);
  hasMore = input(false);
  loadingMore = input(false);
  @Output() placeStake = new EventEmitter<Pod>();
  @Output() toggleSelect = new EventEmitter<Pod>();
  @Output() loadMore = new EventEmitter<void>();

  private snackBar = inject(MatSnackBar);
  readonly socialFeed = inject(SocialFeedService);

  readonly commentPod = signal<Pod | null>(null);

  readonly index = signal(0);
  readonly dragOffset = signal(0);
  readonly dragging = signal(false);

  private lastFirstId = '';

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
    this.index.update(i => i + 1);
    this.dragOffset.set(0);
  }

  prev() {
    if (this.index() <= 0) return;
    this.index.update(i => i - 1);
    this.dragOffset.set(0);
  }

  goTo(i: number) {
    if (i < 0 || i >= this.pods().length) return;
    this.index.set(i);
    this.dragOffset.set(0);
  }

  cardTop(i: number): number {
    return (i - this.index()) * 100;
  }

  visible(i: number): boolean {
    return i >= this.index() - 1 && i <= this.index() + 1;
  }

  // ----- gestures -----
  private startY = 0;
  private moved = false;

  onTouchStart(e: TouchEvent) {
    this.startY = e.touches[0].clientY;
    this.moved = false;
    this.dragging.set(true);
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
    if (delta < -60) this.next();
    else if (delta > 60) this.prev();
    else this.dragOffset.set(0);
    this.moved = false;
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

  isFollowing(pod: Pod): boolean {
    return this.socialFeed.isFollowing(this.socialFeed.creatorOf(pod));
  }

  toggleFollow(pod: Pod) {
    this.socialFeed.toggleFollow(this.socialFeed.creatorOf(pod)).then(msg => {
      if (msg) this.snackBar.open(msg, 'OK', { duration: 2500 });
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
    if (diff < 3600000) return `in ${Math.max(1, Math.round(diff / 60000))}m`;
    if (diff < 86400000) return `in ${Math.round(diff / 3600000)}h`;
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  countdown(ms: number): string {
    if (ms <= 0) return 'Closed';
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    if (hours > 0) return `${hours}h ${mins.toString().padStart(2, '0')}m`;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }

  closingIn(pod: Pod): string {
    const ms = new Date(pod.stakingClosesAt).getTime() - Date.now();
    return this.countdown(Math.max(0, ms));
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
