import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SocialFeedService, CreatorLeaderboardEntry } from '../../../core/services/social-feed.service';
import { AuthService } from '../../../core/services';

@Component({
  selector: 'app-creators-board',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './creators-board.component.html',
  styleUrls: ['./creators-board.component.scss']
})
export class CreatorsBoardComponent implements OnInit {
  readonly social = inject(SocialFeedService);
  private auth = inject(AuthService);

  readonly entries = this.social.creatorLeaderboard;
  readonly loading = this.social.creatorLeaderboardLoading;

  skeletonRows = signal(Array.from({ length: 8 }, (_, i) => i));

  ngOnInit() {
    this.social.fetchCreatorLeaderboard();
  }

  isMe(entry: CreatorLeaderboardEntry): boolean {
    return this.auth.user()?.id === entry.id;
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