import { Component, computed, inject, effect, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SocialFeedService, SocialComment } from '../../../../core/services/social-feed.service';

@Component({
  selector: 'app-comments-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './comments-sheet.component.html',
  styleUrls: ['./comments-sheet.component.scss']
})
export class CommentsSheetComponent implements OnDestroy {
  readonly socialFeed = inject(SocialFeedService);
  private snackBar = inject(MatSnackBar);

  readonly pod = computed(() => this.socialFeed.commentsSheet());

  draft = '';

  constructor() {
    effect(() => {
      const p = this.pod();
      if (p) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
        this.draft = '';
      }
    });
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  commentsFor(): SocialComment[] {
    const p = this.pod();
    return p ? this.socialFeed.commentsFor(p.id) : [];
  }

  count(): number {
    const p = this.pod();
    return p ? this.socialFeed.commentCount(p) : 0;
  }

  close() {
    this.socialFeed.closeCommentsSheet();
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.pod()) this.close();
  }

  async send() {
    const p = this.pod();
    if (!p) return;
    const text = this.draft.trim();
    if (!text) return;
    if (!this.socialFeed.isLoggedIn()) {
      this.snackBar.open('Sign in to join the conversation', 'OK', { duration: 2500 });
      return;
    }
    this.draft = '';
    try {
      await this.socialFeed.postComment(p.id, text);
    } catch {
      this.snackBar.open('Could not post comment — try again', 'OK', { duration: 2500 });
      this.draft = text;
    }
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 86400000 * 7) return `${Math.floor(diff / 86400000)}d ago`;
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  initialOf(name: string): string {
    return (name || 'B').trim().charAt(0).toUpperCase();
  }
}