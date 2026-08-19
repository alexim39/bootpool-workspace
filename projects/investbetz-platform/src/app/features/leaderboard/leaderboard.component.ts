import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { DeviceService, LeaderboardService, LeaderboardPeriod, LeaderboardPage, LeaderboardEntry } from '../../core/services';
import { SocialFeedService } from '../../core/services/social-feed.service';
import { AppNavComponent, MobileNavComponent } from '../../core/components';
import { CreatorsBoardComponent } from './creators-board/creators-board.component';

export type LeaderboardSortField = 'totalStaked' | 'stakeCount' | 'totalWon' | 'lastWinAt';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [RouterModule, CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule, AppNavComponent, MobileNavComponent, CreatorsBoardComponent],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  device = inject(DeviceService);
  isMobileView = computed(() => this.device.isMobile() || this.device.isTablet());
  private service = inject(LeaderboardService);
  private snackBar = inject(MatSnackBar);
  private social = inject(SocialFeedService);
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  view = signal<'stakers' | 'creators'>('stakers');
  period = signal<LeaderboardPeriod>('month');
  page = signal(1);
  pageSize = signal(25);
  searchTerm = signal('');
  sortField = signal<LeaderboardSortField>('totalStaked');
  sortOrder = signal<'asc' | 'desc'>('desc');
  periods: LeaderboardPeriod[] = ['week', 'month', 'all'];
  pageSizes = [10, 25, 50];
  sortOptions: { key: LeaderboardSortField; label: string; icon: string }[] = [
    { key: 'totalStaked', label: 'Most staked', icon: 'paid' },
    { key: 'stakeCount', label: 'Most bets', icon: 'sports_soccer' },
    { key: 'totalWon', label: 'Biggest winner', icon: 'emoji_events' },
    { key: 'lastWinAt', label: 'Latest win', icon: 'schedule' },
  ];
  totalPages = computed(() => {
    const b = this.board();
    return b ? Math.max(1, Math.ceil(b.total / b.limit)) : 1;
  });

  board = this.service.board;
  myRank = this.service.myRank;
  loading = this.service.loading;
  error = this.service.error;

  lastWin = signal<{ podTitle: string; netPayout: number; multiplier: number; settledAt: string } | null>(null);
  shareCopied = signal(false);

  skeletonRows = Array.from({ length: 8 }, (_, i) => i);

  stats = computed(() => {
    const b = this.board();
    const me = this.myRank();
    return {
      totalPlayers: b?.total ?? 0,
      myRank: me?.rank ?? null,
      myStaked: me?.totalStaked ?? 0,
      myWon: me?.totalWon ?? 0,
    };
  });

  hasPrev = computed(() => this.page() > 1);
  hasNext = computed(() => this.page() < this.totalPages());

  ngOnInit() {
    this.setPeriod('month');
    this.social.syncFollows();
    this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((term) => {
      this.searchTerm.set(term);
      this.page.set(1);
      this.load();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(value: string) {
    this.search$.next(value);
  }

  clearSearch() {
    this.searchTerm.set('');
    this.search$.next('');
  }

  setView(v: 'stakers' | 'creators') {
    this.view.set(v);
    if (v === 'stakers' && !this.board()) this.load();
  }

  setPeriod(p: LeaderboardPeriod) {
    this.period.set(p);
    this.page.set(1);
    this.load();
  }

  setPageSize(size: number) {
    this.pageSize.set(size);
    this.page.set(1);
    this.load();
  }

  setSort(field: LeaderboardSortField) {
    if (this.sortField() === field) {
      this.sortOrder.set(this.sortOrder() === 'desc' ? 'asc' : 'desc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('desc');
    }
    this.page.set(1);
    this.load();
  }

  isActiveSort(field: LeaderboardSortField): boolean {
    return this.sortField() === field;
  }

  load() {
    const p = this.period();
    this.service.fetchLeaderboard(
      p,
      this.page(),
      this.pageSize(),
      this.searchTerm(),
      this.sortField(),
      this.sortOrder()
    );
    if (!this.searchTerm()) this.service.fetchMyRank(p);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.service.fetchLeaderboard(
      this.period(),
      p,
      this.pageSize(),
      this.searchTerm(),
      this.sortField(),
      this.sortOrder()
    );
  }

  isMe(entry: LeaderboardEntry): boolean {
    const me = this.myRank();
    return !!me && me.userId === entry.userId;
  }

  isOraEntry(entry: LeaderboardEntry): boolean {
    return this.social.isOraCreator(entry.userId);
  }

  isFollowingEntry(entry: LeaderboardEntry): boolean {
    return this.social.isFollowing(entry.userId);
  }

  async onToggleFollow(event: Event, entry: LeaderboardEntry) {
    event.stopPropagation();
    try {
      const msg = await this.social.toggleFollow(entry.userId);
      if (msg) this.snackBar.open(msg, 'OK', { duration: 2500 });
    } catch {
      this.snackBar.open('Could not update follow — try again', 'OK', { duration: 2500 });
    }
  }

  loadLastWin() {
    this.service.fetchLastWin().subscribe({
      next: (res) => {
        if (res.success) this.lastWin.set(res.data);
      },
      error: () => {}
    });
  }

  rankBadge(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  }

  rankEmblem(rank: number): string {
    if (rank === 1) return '1';
    if (rank === 2) return '2';
    if (rank === 3) return '3';
    return String(rank);
  }

  maxStaked = computed(() => {
    const b = this.board();
    if (!b?.items?.length) return 0;
    return Math.max(...b.items.map(i => i.totalStaked));
  });

  progressWidth(entry: LeaderboardEntry): number {
    const max = this.maxStaked();
    if (!max) return 0;
    return Math.max(4, Math.round((entry.totalStaked / max) * 100));
  }

  rankClass(rank: number): string {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return '';
  }

  formatMoney(n: number): string {
    return '₦' + n.toLocaleString('en-US');
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' });
  }

  shareWin() {
    const w = this.lastWin();
    if (!w) return;
    const text = `I just won ₦${w.netPayout.toLocaleString()} on ${w.podTitle} @ ${w.multiplier}x on BetPool! 🎉`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.shareCopied.set(true);
        this.snackBar.open('Win summary copied — paste it anywhere', 'OK', { duration: 2500 });
        setTimeout(() => this.shareCopied.set(false), 2500);
      }).catch(() => this.snackBar.open('Could not copy — share manually', 'OK', { duration: 2500 }));
    } else {
      this.snackBar.open(text, 'OK', { duration: 6000 });
    }
  }

  shareWinWhatsApp() {
    const w = this.lastWin();
    if (!w) return;
    const text = encodeURIComponent(`I just won ₦${w.netPayout.toLocaleString()} on ${w.podTitle} @ ${w.multiplier}x on BetPool! 🎉`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }
}
