import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SocialProfileStore } from '../../social-profile.store';
import { CodePostCardComponent } from '../../../home/components/code-post-card/code-post-card.component';
import { SocialUserRow, SocialFeedService } from '../../../../core/services/social-feed.service';
import { AppNavComponent, CreatorBadgeComponent } from '../../../../core/components';
import { ACHIEVEMENTS } from '../social-profile-mobile/social-profile-mobile.component';
import { ShareSheetComponent } from '../../components/share-sheet/share-sheet.component';

@Component({
  selector: 'app-social-profile-desktop',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, CodePostCardComponent, AppNavComponent, CreatorBadgeComponent, ShareSheetComponent],
  templateUrl: './social-profile-desktop.component.html',
  styleUrls: ['./social-profile-desktop.component.scss']
})
export class SocialProfileDesktopComponent {
  readonly store = inject(SocialProfileStore);
  readonly social = inject(SocialFeedService);
  readonly achievements = ACHIEVEMENTS;
  private route = inject(ActivatedRoute);

  readonly showShare = signal(false);

  get isGuest(): boolean {
    return !this.social.isLoggedIn();
  }

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) void this.store.load(id);
    });
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  isUnlocked(id: string): boolean {
    const p = this.store.profile();
    return !!p && p.achievements.includes(id);
  }

  roleLabel(): string {
    const p = this.store.profile();
    if (!p) return 'Creator';
    if (p.isSelf) return 'You';
    if (p.user.isOra) return 'AI Curator';
    return 'Creator';
  }

  onUserRow(row: SocialUserRow): void {
    if (row.isSelf) return;
    this.store.openUser(row.id);
  }
}