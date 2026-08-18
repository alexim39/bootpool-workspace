import { Component, inject, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SocialFeedService, CodePost } from '../../../../core/services/social-feed.service';
import { HomeStore } from '../../stores/home.store';

@Component({
  selector: 'app-code-post-card',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './code-post-card.component.html',
  styleUrls: ['./code-post-card.component.scss']
})
export class CodePostCardComponent {
  post = input.required<CodePost>();

  private snackBar = inject(MatSnackBar);
  readonly social = inject(SocialFeedService);
  readonly store = inject(HomeStore);

  commentsOpen = signal(false);
  commentText = signal('');
  staking = signal(false);

  likeCount = computed(() => this.social.likeCountFor(this.post().codeId));
  commentCount = computed(() => this.social.commentCountFor(this.post().codeId));
  liked = computed(() => this.social.isLiked(this.post().codeId));
  saved = computed(() => this.social.isSaved(this.post().codeId));

  isMine = computed(() => {
    const me = this.social.myId();
    return !!me && me === this.post().creatorId;
  });

  creatorName = computed(() => {
    if (this.isMine()) return 'You';
    return this.post().creatorName;
  });

  expiresLabel = computed(() => {
    const iso = this.post().expiresAt;
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const diff = d.getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    if (diff < 3600000) return `expires in ${Math.max(1, Math.round(diff / 60000))}m`;
    if (diff < 86400000) return `expires in ${Math.round(diff / 3600000)}h`;
    return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  });

  legsPreview = computed(() => this.post().legs.slice(0, 3));
  extraLegs = computed(() => Math.max(0, this.post().totalLegs - 3));

  async toggleLike() {
    try {
      await this.social.toggleLike(this.post().codeId);
    } catch {
      // state already rolled back by the service
    }
  }

  async toggleSave() {
    try {
      await this.social.toggleSave(this.post().codeId);
    } catch {
      // state already rolled back by the service
    }
  }

  toggleComments() {
    const next = !this.commentsOpen();
    this.commentsOpen.set(next);
    if (next) this.social.loadComments(this.post().codeId);
  }

  async postComment() {
    const text = this.commentText().trim();
    if (!text) return;
    const ok = await this.social.postComment(this.post().codeId, text);
    if (ok) {
      this.commentText.set('');
    } else if (!this.social.isLoggedIn()) {
      this.snackBar.open('Please log in to comment', 'OK', { duration: 2500 });
    }
  }

  async copyCode() {
    const code = this.post().code;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      this.snackBar.open('Booking code copied', 'OK', { duration: 2000 });
    } catch {
      this.snackBar.open(`Code: ${code}`, 'OK', { duration: 4000 });
    }
  }

  stakeNow() {
    if (!this.social.isLoggedIn()) {
      this.snackBar.open('Please log in to stake', 'OK', { duration: 2500 });
      return;
    }
    if (this.staking()) return;
    this.staking.set(true);
    this.store.redeemBookingCode(this.post().code).subscribe({
      next: (ok) => {
        if (ok) {
          this.snackBar.open('Code applied — set your stake and confirm', 'OK', { duration: 3000 });
        }
        this.staking.set(false);
      },
      error: () => {
        this.staking.set(false);
        this.snackBar.open('Could not apply this code', 'OK', { duration: 2500 });
      }
    });
  }

  formatMoney(amount: number): string {
    return '₦' + amount.toLocaleString('en-US');
  }
}
