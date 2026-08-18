import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SocialProfileStore } from '../../social-profile.store';
import { PodCardComponent } from '../../../home/components/pod-card/pod-card.component';
import { SocialUserRow } from '../../../../core/services/social-feed.service';
import { AppNavComponent } from '../../../../core/components';
import { ACHIEVEMENTS } from '../social-profile-mobile/social-profile-mobile.component';

@Component({
  selector: 'app-social-profile-desktop',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, PodCardComponent, AppNavComponent],
  templateUrl: './social-profile-desktop.component.html',
  styleUrls: ['./social-profile-desktop.component.scss']
})
export class SocialProfileDesktopComponent {
  readonly store = inject(SocialProfileStore);
  readonly achievements = ACHIEVEMENTS;
  private route = inject(ActivatedRoute);

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