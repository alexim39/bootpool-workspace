import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SocialFeedService, CreatorLeaderboardEntry } from '../../../core/services/social-feed.service';
import { AuthService } from '../../../core/services';

@Component({
  selector: 'app-creators-board',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatSnackBarModule],
  templateUrl: './creators-board.component.html',
  styleUrls: ['./creators-board.component.scss']
})
export class CreatorsBoardComponent implements OnInit {
  readonly social = inject(SocialFeedService);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  readonly entries = this.social.creatorLeaderboard;
  readonly loading = this.social.creatorLeaderboardLoading;

  skeletonRows = signal(Array.from({ length: 8 }, (_, i) => i));

  ngOnInit() {
    this.social.fetchCreatorLeaderboard();
  }

  isMe(entry: CreatorLeaderboardEntry): boolean {
    return this.auth.user()?.id === entry.id;
  }

  isOraEntry(entry: CreatorLeaderboardEntry): boolean {
    return this.social.isOraCreator(entry.id);
  }

  isFollowingEntry(entry: CreatorLeaderboardEntry): boolean {
    return this.social.isFollowing(entry.id);
  }

  async onToggleFollow(event: Event, entry: CreatorLeaderboardEntry) {
    event.preventDefault();
    event.stopPropagation();
    try {
      const msg = await this.social.toggleFollow(entry.id);
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
    return '₦' + n.toLocaleString('en-US');
  }
}