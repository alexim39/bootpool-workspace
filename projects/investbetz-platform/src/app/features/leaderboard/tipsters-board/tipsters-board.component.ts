import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LeaderboardService, LeaderboardPeriod, TipsterBoardEntry, TipsterSortField } from '../../../core/services/leaderboard.service';
import { SocialFeedService } from '../../../core/services/social-feed.service';
import { AuthService } from '../../../core/services';
import { CreatorBadgeComponent } from '../../../core/components';

@Component({
  selector: 'app-tipsters-board',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatSnackBarModule, CreatorBadgeComponent],
  templateUrl: './tipsters-board.component.html',
  styleUrls: ['./tipsters-board.component.scss']
})
export class TipstersBoardComponent implements OnInit {
  private board = inject(LeaderboardService);
  readonly social = inject(SocialFeedService);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  readonly entries = this.board.tipsterBoard;
  readonly loading = this.board.tipsterLoading;

  readonly period = signal<LeaderboardPeriod>('month');
  readonly sortField = signal<TipsterSortField>('roi');
  readonly periods: LeaderboardPeriod[] = ['week', 'month', 'all'];

  skeletonRows = signal(Array.from({ length: 8 }, (_, i) => i));

  ngOnInit() {
    this.load();
  }

  setPeriod(p: LeaderboardPeriod) {
    this.period.set(p);
    this.load();
  }

  setSort(field: TipsterSortField) {
    this.sortField.set(field);
    this.load();
  }

  private load() {
    this.board.fetchTipsterBoard(this.period(), 25, 25, this.sortField(), 'desc');
  }

  isMe(entry: TipsterBoardEntry): boolean {
    return this.auth.user()?.id === entry.userId;
  }

  isOraEntry(entry: TipsterBoardEntry): boolean {
    return this.social.isOraCreator(entry.userId);
  }

  isFollowingEntry(entry: TipsterBoardEntry): boolean {
    return this.social.isFollowing(entry.userId);
  }

  async onToggleFollow(event: Event, entry: TipsterBoardEntry) {
    event.preventDefault();
    event.stopPropagation();
    try {
      const msg = await this.social.toggleFollow(entry.userId);
      if (msg) this.snackBar.open(msg, 'OK', { duration: 2500 });
    } catch {
      this.snackBar.open('Could not update follow — try again', 'OK', { duration: 2500 });
    }
  }

  rankClass(rank: number): string {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return '';
  }

  rankEmblem(rank: number): string {
    if (rank === 1) return '1';
    if (rank === 2) return '2';
    if (rank === 3) return '3';
    return String(rank);
  }

  formatMoney(n: number): string {
    const sign = n < 0 ? '-' : '';
    return `${sign}₦${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
  }
}
