import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SocialProfileStore } from '../../social-profile.store';
import { CodePostCardComponent } from '../../../home/components/code-post-card/code-post-card.component';
import { SocialUserRow } from '../../../../core/services/social-feed.service';
import { MobileNavComponent } from '../../../../core/components';

export interface AchievementDef {
  id: string;
  icon: string;
  color: string;
  label: string;
  desc: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'ai_curator', icon: 'auto_awesome', color: '#16c79a', label: 'Ora AI Curator', desc: "The platform's AI curator" },
  { id: 'first_code', icon: 'qr_code_2', color: '#64ffda', label: 'First code', desc: 'Shared your first booking code' },
  { id: 'rising_creator', icon: 'trending_up', color: '#0f86ff', label: 'Rising creator', desc: 'Shared 5+ booking codes' },
  { id: 'veteran_creator', icon: 'military_tech', color: '#ffd166', label: 'Veteran creator', desc: 'Shared 20+ booking codes' },
  { id: 'trending', icon: 'local_fire_department', color: '#ff6b6b', label: 'Trending', desc: 'Reached 10 followers' },
  { id: 'pick_star', icon: 'star', color: '#ffd166', label: 'Pick star', desc: 'Reached 25 followers' },
  { id: 'community_pick', icon: 'groups', color: '#4ecdc4', label: 'Community pick', desc: '5+ people staked on your codes' },
  { id: 'crowd_favorite', icon: 'favorite', color: '#ff6b81', label: 'Crowd favorite', desc: 'Received 10+ likes' }
];

@Component({
  selector: 'app-social-profile-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, CodePostCardComponent, MobileNavComponent],
  templateUrl: './social-profile-mobile.component.html',
  styleUrls: ['./social-profile-mobile.component.scss']
})
export class SocialProfileMobileComponent {
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

  followLabel(): string {
    const p = this.store.profile();
    return p?.isFollowing ? 'Following' : 'Follow';
  }

  onUserRow(row: SocialUserRow): void {
    if (row.isSelf) return;
    this.store.openUser(row.id);
  }
}