import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { SocialFeedService, SocialCreator } from '../../../../core/services/social-feed.service';

@Component({
  selector: 'app-who-to-follow',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule, RouterModule],
  templateUrl: './who-to-follow.component.html',
  styleUrls: ['./who-to-follow.component.scss']
})
export class WhoToFollowComponent {
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  readonly socialFeed = inject(SocialFeedService);

  initialOf(name: string): string {
    return (name || 'B').trim().charAt(0).toUpperCase();
  }

  openProfile(id: string) {
    this.router.navigate(['/social', id]);
  }

  async follow(event: Event, c: SocialCreator) {
    event.stopPropagation();
    try {
      const msg = await this.socialFeed.toggleFollow(c.id);
      if (msg) this.snackBar.open(msg, 'OK', { duration: 2500 });
    } catch {
      this.snackBar.open('Could not update follow — try again', 'OK', { duration: 2500 });
    }
  }
}