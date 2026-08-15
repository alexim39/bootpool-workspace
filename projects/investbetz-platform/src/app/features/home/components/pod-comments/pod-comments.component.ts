import { Component, input, output, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Pod } from '../../../../core/services';
import { SocialFeedService, SocialComment } from '../../../../core/services/social-feed.service';

@Component({
  selector: 'app-pod-comments',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './pod-comments.component.html',
  styleUrls: ['./pod-comments.component.scss']
})
export class PodCommentsComponent {
  pod = input.required<Pod>();
  open = input(false);
  close = output<void>();

  private snackBar = inject(MatSnackBar);
  readonly socialFeed = inject(SocialFeedService);

  draft = '';

  constructor() {
    effect(() => {
      if (this.open() && this.pod()) {
        this.socialFeed.loadComments(this.pod().id);
      }
    });
  }

  commentsFor(pod: Pod): SocialComment[] {
    return this.socialFeed.commentsFor(pod.id);
  }

  count(pod: Pod): number {
    return this.socialFeed.commentCount(pod);
  }

  onClose() {
    this.draft = '';
    this.close.emit();
  }

  async send(pod: Pod) {
    const text = this.draft.trim();
    if (!text) return;
    if (!this.socialFeed.isLoggedIn()) {
      this.snackBar.open('Sign in to join the conversation', 'OK', { duration: 2500 });
      return;
    }
    this.draft = '';
    try {
      await this.socialFeed.postComment(pod.id, text);
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
