import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SocialFeedService, SocialProfile, SocialUserRow } from '../../core/services/social-feed.service';
import { Pod } from '../../core/services';

export type SocialProfileTab = 'picks' | 'followers' | 'following';

@Injectable({ providedIn: 'root' })
export class SocialProfileStore {
  private _social = inject(SocialFeedService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  readonly profile = signal<SocialProfile | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly tab = signal<SocialProfileTab>('picks');

  readonly followers = signal<SocialUserRow[]>([]);
  readonly followersTotal = signal(0);
  readonly followersLoading = signal(false);
  private followersLoaded = false;
  private followersPage = 0;

  readonly following = signal<SocialUserRow[]>([]);
  readonly followingTotal = signal(0);
  readonly followingLoading = signal(false);
  private followingLoaded = false;
  private followingPage = 0;

  readonly picks = signal<Pod[]>([]);
  readonly picksTotal = signal(0);
  readonly picksLoading = signal(false);
  readonly picksHasMore = signal(false);
  private picksPage = 0;

  private currentId = '';

  retry(): void {
    if (this.currentId) void this.load(this.currentId);
  }

  async load(userId: string): Promise<void> {
    this.currentId = userId;
    this.loading.set(true);
    this.error.set(null);
    this.profile.set(null);
    this.tab.set('picks');
    this.picks.set([]);
    this.followers.set([]);
    this.following.set([]);
    this.followersLoaded = false;
    this.followingLoaded = false;
    this.picksPage = 0;
    this.followersPage = 0;
    this.followingPage = 0;
    try {
      const p = await this._social.fetchProfile(userId);
      if (!p) {
        this.error.set('Profile could not be loaded.');
        return;
      }
      this.profile.set(p);
      await Promise.all([this.loadPicks(), this.loadFollowers(), this.loadFollowing()]);
    } catch {
      this.error.set('Profile could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadPicks(): Promise<void> {
    const userId = this.currentId;
    if (!userId || this.picksLoading()) return;
    this.picksLoading.set(true);
    try {
      const page = this.picksPage + 1;
      const res = await this._social.fetchCreatorPicks(userId, page, 12);
      this.picksPage = page;
      this.picks.update(prev => (page === 1 ? res.items : [...prev, ...res.items]));
      this.picksTotal.set(res.total);
      this.picksHasMore.set(this.picks().length < res.total);
    } finally {
      this.picksLoading.set(false);
    }
  }

  async loadMorePicks(): Promise<void> {
    await this.loadPicks();
  }

  async loadFollowers(): Promise<void> {
    const userId = this.currentId;
    if (!userId || this.followersLoading() || this.followersLoaded) return;
    this.followersLoading.set(true);
    try {
      const page = this.followersPage + 1;
      const res = await this._social.fetchFollowers(userId, page, 20);
      this.followersPage = page;
      this.followers.update(prev => (page === 1 ? res.items : [...prev, ...res.items]));
      this.followersTotal.set(res.total);
      if (this.followers().length >= res.total) this.followersLoaded = true;
    } finally {
      this.followersLoading.set(false);
    }
  }

  async loadFollowing(): Promise<void> {
    const userId = this.currentId;
    if (!userId || this.followingLoading() || this.followingLoaded) return;
    this.followingLoading.set(true);
    try {
      const page = this.followingPage + 1;
      const res = await this._social.fetchFollowingUsers(userId, page, 20);
      this.followingPage = page;
      this.following.update(prev => (page === 1 ? res.items : [...prev, ...res.items]));
      this.followingTotal.set(res.total);
      if (this.following().length >= res.total) this.followingLoaded = true;
    } finally {
      this.followingLoading.set(false);
    }
  }

  async loadTab(tab: SocialProfileTab): Promise<void> {
    this.tab.set(tab);
    if (tab === 'picks' && this.picks().length === 0) await this.loadPicks();
    if (tab === 'followers' && this.followers().length === 0) await this.loadFollowers();
    if (tab === 'following' && this.following().length === 0) await this.loadFollowing();
  }

  async toggleFollow(): Promise<void> {
    const p = this.profile();
    if (!p || p.isSelf || p.user.isOra) return;
    const was = p.isFollowing;
    this.profile.update(cur => (cur ? { ...cur, isFollowing: !was } : cur));
    try {
      await this._social.toggleFollow(p.user.id);
      const now = this._social.isFollowing(p.user.id);
      this.profile.update(cur => (cur ? { ...cur, isFollowing: now } : cur));
    } catch {
      this.profile.update(cur => (cur ? { ...cur, isFollowing: was } : cur));
    }
  }

  async followRow(row: SocialUserRow): Promise<void> {
    if (row.isSelf || row.isOra) return;
    const was = row.isFollowing;
    this.updateRow(row.id, { isFollowing: !was });
    try {
      await this._social.toggleFollow(row.id);
      this.updateRow(row.id, { isFollowing: this._social.isFollowing(row.id) });
    } catch {
      this.updateRow(row.id, { isFollowing: was });
    }
  }

  private updateRow(id: string, patch: Partial<SocialUserRow>): void {
    this.followers.update(rows => rows.map(r => (r.id === id ? { ...r, ...patch } : r)));
    this.following.update(rows => rows.map(r => (r.id === id ? { ...r, ...patch } : r)));
  }

  async shareProfile(): Promise<void> {
    const p = this.profile();
    if (!p) return;
    const url = window.location.origin + '/social/' + p.user.id;
    try {
      await navigator.share({ title: p.user.fullName + ' on BetPool', text: 'Check out ' + p.user.fullName + ' on BetPool', url });
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        this.snackBar.open('Profile link copied to clipboard', 'OK', { duration: 2500 });
      } catch {
        this.snackBar.open('Could not share profile', 'OK', { duration: 2500 });
      }
    }
  }

  openPod(pod: Pod): void {
    this.router.navigate(['/home'], { queryParams: { pod: pod.id } });
  }

  openUser(id: string): void {
    if (id === this.currentId) return;
    this.router.navigate(['/social', id]);
  }
}