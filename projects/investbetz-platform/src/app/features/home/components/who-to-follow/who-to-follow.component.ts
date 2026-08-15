import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SocialFeedService, SocialCreator } from '../../../../core/services/social-feed.service';

@Component({
  selector: 'app-who-to-follow',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './who-to-follow.component.html',
  styleUrls: ['./who-to-follow.component.scss']
})
export class WhoToFollowComponent {
  private snackBar = inject(MatSnackBar);
  readonly socialFeed = inject(SocialFeedService);

  initialOf(name: string): string {
    return (name || 'B').trim().charAt(0).toUpperCase();
  }

  async follow(c: SocialCreator) {
    try {
      const msg = await this.socialFeed.toggleFollow(c.id);
      if (msg) this.snackBar.open(msg, 'OK', { duration: 2500 });
    } catch {
      this.snackBar.open('Could not update follow — try again', 'OK', { duration: 2500 });
    }
  }
}
