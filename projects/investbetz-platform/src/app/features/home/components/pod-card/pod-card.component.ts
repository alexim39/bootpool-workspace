import { Component, Output, EventEmitter, computed, input, inject, signal, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Pod } from '../../../../core/services';
import { SocialFeedService } from '../../../../core/services';
import { PodCommentsComponent } from '../pod-comments/pod-comments.component';

@Component({
  selector: 'app-pod-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    PodCommentsComponent
  ],
  templateUrl: './pod-card.component.html',
  styleUrls: ['./pod-card.component.scss']
})
export class PodCardComponent implements OnDestroy {
  pod = input.required<Pod>();
  selected = input(false);
  selectionDisabled = input(false);
  social = input(true);
  @Output() placeStake = new EventEmitter<Pod>();
  @Output() toggleSelect = new EventEmitter<Pod>();

  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  readonly socialFeed = inject(SocialFeedService);
  private ngZone = inject(NgZone);

  private readonly now = signal(Date.now());
  private nowTimer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    this.nowTimer = setInterval(() => {
      this.ngZone.run(() => this.now.set(Date.now()));
    }, 1000);
  }

  ngOnDestroy() {
    if (this.nowTimer) clearInterval(this.nowTimer);
  }

  readonly showComments = signal(false);

  readonly creator = computed(() => this.socialFeed.creatorOf(this.pod()));
  readonly isOra = computed(() => this.socialFeed.isOraCreator(this.creator()));
  readonly isMyPod = computed(() => this.socialFeed.isMyPod(this.pod()));
  readonly creatorName = computed(() => this.socialFeed.creatorNameFor(this.pod()));
  readonly following = computed(() => this.socialFeed.isFollowing(this.creator()));
  readonly liked = computed(() => this.socialFeed.isLiked(this.pod().id));
  readonly saved = computed(() => this.socialFeed.isSaved(this.pod().id));
  readonly proof = computed(() => this.socialFeed.proofText(this.pod()));
  readonly likeCount = computed(() => this.socialFeed.likeCount(this.pod()));
  readonly commentCount = computed(() => this.socialFeed.commentCount(this.pod()));

  readonly creatorTime = computed(() => {
    const p = this.pod();
    if (p.isLive) return 'LIVE';
    const d = new Date(p.matchDate || p.stakingClosesAt);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    if (diff < 0) return 'Opens soon';
    if (diff < 3600000) return `Starts in ${Math.max(1, Math.round(diff / 60000))}m`;
    if (diff < 86400000) return `Starts in ${Math.round(diff / 3600000)}h`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  });

  toggleLike() {
    this.socialFeed.toggleLike(this.pod().id).catch(() => {
      this.snackBar.open('Could not update like — try again', 'OK', { duration: 2500 });
    });
  }

  toggleSave() {
    this.socialFeed.toggleSave(this.pod().id).catch(() => {
      this.snackBar.open('Could not update save — try again', 'OK', { duration: 2500 });
    });
  }

  toggleFollow() {
    this.socialFeed.toggleFollow(this.creator()).then(msg => {
      if (msg) this.snackBar.open(msg, 'OK', { duration: 2500 });
    }).catch(() => {
      this.snackBar.open('Could not update follow — try again', 'OK', { duration: 2500 });
    });
  }

  openCreatorProfile() {
    this.router.navigate(['/social', this.creator()]);
  }

  async share() {
    const msg = await this.socialFeed.sharePod(this.pod());
    if (msg) this.snackBar.open(msg, 'OK', { duration: 2500 });
  }

  timeRemaining = computed(() => {
    return Math.max(0, new Date(this.pod().stakingClosesAt).getTime() - this.now());
  });

  exposurePercent = computed(() => {
    const p = this.pod();
    if (!p.maxTotalExposure || p.maxTotalExposure === 0) return 0;
    return (p.currentExposure || 0) / p.maxTotalExposure * 100;
  });

  confidence = computed(() => {
    const p = this.pod();
    const ora = Number(p.metadata?.['oraConfidence'] ?? 0);
    if (ora > 0) return Math.round(Math.min(100, Math.max(0, ora)));
    const imp = p.impliedProbability || 0;
    if (imp > 0) return Math.round(Math.min(100, Math.max(0, imp * 100)));
    return 0;
  });

  confidenceLevel = computed<'high' | 'medium' | 'low'>(() => {
    const c = this.confidence();
    if (c >= 70) return 'high';
    if (c >= 45) return 'medium';
    return 'low';
  });

  confidenceTooltip = computed(() => {
    const c = this.confidence();
    if (c >= 70) return `High confidence (${c}%) — Ora's model strongly favors this pick`;
    if (c >= 45) return `Moderate confidence (${c}%) — competitive fixture, consider your stake`;
    return `Low confidence (${c}%) — high-variance fixture, a smaller stake is safer`;
  });

  gainsTooltip = computed(() => {
    return `Gains: ${this.pod().gainsMultiplier.toFixed(1)}x`;
  });

  oraReasoning = computed(() => {
    const meta = this.pod().metadata;
    if (meta?.['oraReasoning']) return meta['oraReasoning'] as string;
    if (meta?.['oraCurated']) return 'This pick was selected by Ora AI based on team form, head-to-head data, and market analysis.';
    return null;
  });

  recommended = computed(() => !!this.pod().whyRecommended);

  whyText = computed(() => this.pod().whyRecommended || this.oraReasoning());

  formatCountdown(ms: number): string {
    if (ms <= 0) return 'Closed';
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const parts = [];
    if (days > 0) parts.push(`${days.toString().padStart(2, '0')}d`);
    if (hours > 0 || days > 0) parts.push(`${hours.toString().padStart(2, '0')}h`);
    if (mins > 0 || hours > 0 || days > 0) parts.push(`${mins.toString().padStart(2, '0')}m`);
    parts.push(`${secs.toString().padStart(2, '0')}s`);
    return parts.join(' : ');
  }

  isOfferClosed(): boolean {
    return this.timeRemaining() <= 0 || this.pod().status !== 'active';
  }

  onPlaceStake() {
    this.placeStake.emit(this.pod());
  }

  onToggleSelect() {
    this.toggleSelect.emit(this.pod());
  }
}
