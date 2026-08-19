import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pod, PodService } from './pod.service';
import { AuthService } from './auth.service';

const STORAGE_KEY = 'betpool_social_v1';

export interface SocialComment {
  id: string;
  podId: string;
  authorId: string;
  authorName: string;
  authorUsername?: string | null;
  text: string;
  createdAt: string;
}

export interface SocialCreator {
  id: string;
  fullName: string;
  username?: string | null;
  podCount: number;
  codeCount?: number;
  followerCount: number;
  isOra: boolean;
  isFollowing: boolean;
}

export interface CodePostLeg {
  podId: string;
  homeTeam: string;
  awayTeam: string;
  selection: string;
  multiplier: number;
}

export interface CodePost {
  kind: 'code';
  id: string;
  codeId: string;
  code: string;
  creatorId: string;
  creatorName: string;
  creatorUsername?: string | null;
  boosted: boolean;
  createdAt: number;
  expiresAt: string | null;
  combinedMultiplier: number;
  legCount: number;
  legs: CodePostLeg[];
  totalLegs: number;
  stakeAmount: number | null;
}

export interface CreatorViralityProfile {
  score: number;
  codesShared: number;
  stakesPlaced: number;
  wins: number;
  badge: string;
  isTopCreator: boolean;
  rank: number | null;
}

export interface CreatorLeaderboardEntry {
  id: string;
  fullName: string;
  score: number;
  codesShared: number;
  stakesPlaced: number;
  wins: number;
  badge: string;
  isTopCreator: boolean;
}

export interface SocialProfile {
  user: { id: string; fullName: string; username?: string | null; isOra: boolean };
  stats: { codes: number; followers: number; following: number; likesReceived: number; stakers: number };
  achievements: string[];
  virality?: CreatorViralityProfile;
  isSelf: boolean;
  isFollowing: boolean;
}

export interface SocialUserRow {
  id: string;
  fullName: string;
  username?: string | null;
  isOra: boolean;
  isSelf: boolean;
  isFollowing: boolean;
}

interface SocialState {
  likes: string[];
  saves: string[];
  follows: string[];
}

interface SocialStatsData {
  likes: Record<string, number>;
  comments: Record<string, number>;
  liked: string[];
  saved: string[];
}

interface ToggleLikeData {
  liked: boolean;
  count: number;
}

interface ToggleSaveData {
  saved: boolean;
}

interface ToggleFollowData {
  following: boolean;
  followerCount: number;
}

interface CommentData {
  _id: string;
  pod: string;
  user: { _id: string; fullName: string; username?: string };
  text: string;
  createdAt: string;
}

function loadState(): SocialState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { likes: [], saves: [], follows: [] };
    const parsed = JSON.parse(raw) as SocialState;
    return {
      likes: Array.isArray(parsed.likes) ? parsed.likes : [],
      saves: Array.isArray(parsed.saves) ? parsed.saves : [],
      follows: Array.isArray(parsed.follows) ? parsed.follows : [],
    };
  } catch {
    return { likes: [], saves: [], follows: [] };
  }
}

@Injectable({ providedIn: 'root' })
export class SocialFeedService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private podsSvc = inject(PodService);

  private readonly API_URL = environment.apiUrl;
  private guest = loadState();

  private serverLikeCounts = signal<Record<string, number>>({});
  private serverCommentCounts = signal<Record<string, number>>({});

  readonly likes = signal<string[]>(this.guest.likes);
  readonly saves = signal<string[]>(this.guest.saves);
  readonly follows = signal<string[]>(this.guest.follows);

  readonly comments = signal<Record<string, SocialComment[]>>({});
  readonly commentsLoading = signal(false);
  readonly commentPosting = signal(false);

  readonly creators = signal<SocialCreator[]>([]);
  readonly creatorsLoading = signal(false);

  readonly followingPosts = signal<CodePost[]>([]);
  readonly followingTotal = signal(0);
  readonly followingLoading = signal(false);
  readonly followingHasMore = signal(false);
  private followingPage = 0;
  private followingLoaded = false;

  readonly creatorLeaderboard = signal<CreatorLeaderboardEntry[]>([]);
  readonly creatorLeaderboardLoading = signal(false);

  readonly savedPods = signal<(Pod | CodePost)[]>([]);
  readonly savedTotal = signal(0);
  readonly savedLoading = signal(false);
  readonly savedHasMore = signal(false);
  private savedPage = 0;
  private savedLoaded = false;

  readonly isLoggedIn = computed(() => this.auth.isAuthenticated());

  readonly myId = computed(() => this.auth.user()?.id ?? '');

  readonly oraId = computed(() => this.podsSvc.oraId());

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        likes: this.likes(),
        saves: this.saves(),
        follows: this.follows(),
      }));
    } catch {
      // storage unavailable — social state stays in memory
    }
  }

  private headers() {
    return { headers: { Authorization: `Bearer ${this.auth.token()}` } };
  }

  isLiked(podId: string): boolean {
    return this.likes().includes(podId);
  }

  isSaved(podId: string): boolean {
    return this.saves().includes(podId);
  }

  isFollowing(creator: string): boolean {
    if (!creator) return true;
    if (this.isOraCreator(creator)) return true;
    return this.follows().includes(creator);
  }

  isOraCreator(creator: string): boolean {
    return !!creator && (creator === this.oraId() || creator === 'ora');
  }

  creatorOf(pod: Pod): string {
    return pod.createdBy || 'ora';
  }

  isMyPod(pod: Pod): boolean {
    const me = this.myId();
    return !!me && !!pod.createdBy && pod.createdBy === me;
  }

  creatorNameFor(pod: Pod): string {
    if (this.isOraCreator(pod.createdBy)) return 'Ora';
    if (this.isMyPod(pod)) return 'You';
    return pod.creatorName || 'Ora';
  }

  creatorName(creator: string): string {
    return creator === this.oraId() ? 'Ora' : creator;
  }

  likeCount(pod: Pod): number {
    return this.serverLikeCounts()[pod.id] || (this.isLiked(pod.id) ? 1 : 0);
  }

  commentCount(pod: Pod): number {
    return this.serverCommentCounts()[pod.id] || 0;
  }

  likeCountFor(id: string): number {
    return this.serverLikeCounts()[id] || (this.isLiked(id) ? 1 : 0);
  }

  commentCountFor(id: string): number {
    return this.serverCommentCounts()[id] || 0;
  }

  async fetchCreatorLeaderboard(): Promise<void> {
    if (this.creatorLeaderboardLoading()) return;
    this.creatorLeaderboardLoading.set(true);
    try {
      const res = await lastValueFrom(this.http.get<{ success: boolean; data: { items: CreatorLeaderboardEntry[] } }>(
        `${this.API_URL}/social/leaderboard?limit=20`,
        this.headers()
      ));
      if (res.success) this.creatorLeaderboard.set(res.data?.items || []);
    } catch {
      // leaderboard stays empty on failure
    } finally {
      this.creatorLeaderboardLoading.set(false);
    }
  }

  async hydrateSocial(pods: Pod[]): Promise<void> {
    const loggedIn = this.isLoggedIn();
    const oraId = this.oraId();
    if (oraId) {
      this.follows.update(cur => cur.includes(oraId) ? cur : [...cur, oraId]);
      this.persist();
    }
    if (!loggedIn) return;
    const ids = pods.map(p => p.id).filter(Boolean);
    const requests: Promise<void>[] = [];
    if (ids.length > 0) {
      requests.push(this.hydrateStats(ids));
    }
    await Promise.all(requests);
    await this.syncFollows();
    await this.fetchCreators();
  }

  async syncFollows(): Promise<void> {
    if (!this.isLoggedIn()) return;
    try {
      const res = await lastValueFrom(this.http.get<{ success: boolean; data: { ids: string[]; oraId: string } }>(
        `${this.API_URL}/social/following`,
        this.headers()
      ));
      if (res.success && res.data) {
        if (res.data.oraId) this.podsSvc.oraId.set(res.data.oraId);
        const idsSet = new Set(res.data.ids || []);
        const ora = res.data.oraId;
        if (ora) idsSet.add(ora);
        this.follows.set([...idsSet]);
        this.persist();
      }
    } catch {
      // keep current follow state
    }
  }

  private async hydrateStats(ids: string[]): Promise<void> {
    const unique = [...new Set(ids)].filter(Boolean);
    const BATCH = 30;
    for (let i = 0; i < unique.length; i += BATCH) {
      const chunk = unique.slice(i, i + BATCH);
      try {
        const res = await lastValueFrom(this.http.get<{ success: boolean; data: SocialStatsData }>(
          `${this.API_URL}/social/stats?podIds=${chunk.join(',')}`,
          this.headers()
        ));
        if (!res.success) continue;
        this.serverLikeCounts.update(cur => ({ ...cur, ...(res.data.likes || {}) }));
        this.serverCommentCounts.update(cur => ({ ...cur, ...(res.data.comments || {}) }));
        if (res.data.liked?.length) {
          this.likes.update(cur => {
            const merged = [...cur];
            for (const id of res.data.liked) {
              if (!merged.includes(id)) merged.push(id);
            }
            return merged;
          });
        }
        if (res.data.saved?.length) {
          this.saves.update(cur => {
            const merged = [...cur];
            for (const id of res.data.saved) {
              if (!merged.includes(id)) merged.push(id);
            }
            return merged;
          });
        }
      } catch {
        // stats are progressive — keep whatever state exists
      }
    }
  }

  async fetchCreators(): Promise<void> {
    if (!this.isLoggedIn()) return;
    if (this.creatorsLoading()) return;
    this.creatorsLoading.set(true);
    try {
      const res = await lastValueFrom(this.http.get<{ success: boolean; data: SocialCreator[] }>(
        `${this.API_URL}/social/creators?limit=12`,
        this.headers()
      ));
      if (res.success) this.creators.set(res.data || []);
    } catch {
      // discovery rail stays hidden on failure
    } finally {
      this.creatorsLoading.set(false);
    }
  }

  private mapFeedPod(i: any): Pod {
    return {
      ...i,
      id: i._id || i.id,
      kind: (i.kind || 'pod') as 'pod',
      createdBy: i.createdBy || '',
      creatorName: i.creatorName ?? null,
      timeRemaining: Math.max(0, new Date(i.stakingClosesAt).getTime() - Date.now()),
      isOpen: new Date(i.stakingClosesAt) >= new Date() && i.status === 'active'
    };
  }

  private mapCodePost(i: any): CodePost {
    return {
      kind: 'code',
      id: i._id || i.id || '',
      codeId: i.codeId || '',
      code: i.code || '',
      creatorId: i.creatorId || '',
      creatorName: i.creatorName || 'BetPool user',
      creatorUsername: i.creatorUsername || null,
      boosted: !!i.boosted,
      createdAt: typeof i.createdAt === 'number' ? i.createdAt : new Date(i.createdAt).getTime(),
      expiresAt: i.expiresAt || null,
      combinedMultiplier: Number(i.combinedMultiplier) || 1,
      legCount: Number(i.legCount) || 0,
      legs: Array.isArray(i.legs) ? i.legs.map((l: any) => ({
        podId: String(l.podId || ''),
        homeTeam: l.homeTeam,
        awayTeam: l.awayTeam,
        selection: l.selection,
        multiplier: Number(l.multiplier) || 1
      })) : [],
      totalLegs: Number(i.totalLegs) || Number(i.legCount) || 0,
      stakeAmount: i.stakeAmount != null ? Number(i.stakeAmount) : null
    };
  }

  async ensureFollowingLoaded(): Promise<void> {
    if (!this.isLoggedIn()) {
      this.followingPosts.set([]);
      this.followingTotal.set(0);
      return;
    }
    if (this.followingLoaded) return;
    await this.fetchFollowingFeed();
  }

  async fetchFollowingFeed(): Promise<void> {
    if (!this.isLoggedIn()) return;
    if (this.followingLoading()) return;
    this.followingLoading.set(true);
    try {
      const res = await lastValueFrom(this.http.get<{ success: boolean; data: { items: any[]; total: number } }>(
        `${this.API_URL}/social/feed?page=1&limit=20`,
        this.headers()
      ));
      if (res.success) {
        const items = (res.data.items || []).map(i => this.mapCodePost(i));
        this.followingPosts.set(items);
        this.followingTotal.set(res.data.total);
        this.followingPage = 1;
        this.followingLoaded = true;
        this.followingHasMore.set(items.length < res.data.total);
        this.hydrateStats(items.map(p => p.codeId));
      }
    } catch {
      // following feed stays empty on failure
    } finally {
      this.followingLoading.set(false);
    }
  }

  async loadMoreFollowing(): Promise<void> {
    if (!this.isLoggedIn() || !this.followingHasMore() || this.followingLoading()) return;
    this.followingLoading.set(true);
    try {
      const page = this.followingPage + 1;
      const res = await lastValueFrom(this.http.get<{ success: boolean; data: { items: any[]; total: number } }>(
        `${this.API_URL}/social/feed?page=${page}&limit=20`,
        this.headers()
      ));
      if (res.success) {
        const items = (res.data.items || []).map(i => this.mapCodePost(i));
        this.followingPosts.update(cur => {
          const seen = new Set(cur.map(p => p.id));
          return [...cur, ...items.filter(p => !seen.has(p.id))];
        });
        this.followingPage = page;
        this.followingHasMore.set(this.followingPosts().length < res.data.total);
        this.hydrateStats(items.map(p => p.codeId));
      }
    } catch {
      // keep current following feed on failure
    } finally {
      this.followingLoading.set(false);
    }
  }

  refreshFollowingFeed(): void {
    this.followingLoaded = false;
    if (this.isLoggedIn()) this.fetchFollowingFeed();
  }

  async ensureSavedLoaded(): Promise<void> {
    if (!this.isLoggedIn()) {
      this.savedPods.set([]);
      this.savedTotal.set(0);
      return;
    }
    if (this.savedLoaded) return;
    await this.fetchSavedPods();
  }

  async fetchSavedPods(): Promise<void> {
    if (!this.isLoggedIn()) return;
    if (this.savedLoading()) return;
    this.savedLoading.set(true);
    try {
      const res = await lastValueFrom(this.http.get<{ success: boolean; data: { items: any[]; total: number } }>(
        `${this.API_URL}/social/saved?page=1&limit=20`,
        this.headers()
      ));
      if (res.success) {
        const items = (res.data.items || []).map(i => i.kind === 'code' ? this.mapCodePost(i) : this.mapFeedPod(i));
        this.savedPods.set(items);
        this.savedTotal.set(res.data.total);
        this.savedPage = 1;
        this.savedLoaded = true;
        this.savedHasMore.set(items.length < res.data.total);
        this.hydrateStats(items.map(p => p.id));
      }
    } catch {
      // saved list stays empty on failure
    } finally {
      this.savedLoading.set(false);
    }
  }

  async loadMoreSaved(): Promise<void> {
    if (!this.isLoggedIn() || !this.savedHasMore() || this.savedLoading()) return;
    this.savedLoading.set(true);
    try {
      const page = this.savedPage + 1;
      const res = await lastValueFrom(this.http.get<{ success: boolean; data: { items: any[]; total: number } }>(
        `${this.API_URL}/social/saved?page=${page}&limit=20`,
        this.headers()
      ));
      if (res.success) {
        const items = (res.data.items || []).map(i => i.kind === 'code' ? this.mapCodePost(i) : this.mapFeedPod(i));
        this.savedPods.update(cur => {
          const seen = new Set(cur.map(p => p.id));
          return [...cur, ...items.filter(p => !seen.has(p.id))];
        });
        this.savedPage = page;
        this.savedHasMore.set(this.savedPods().length < res.data.total);
        this.hydrateStats(items.map(p => p.id));
      }
    } catch {
      // keep current saved list on failure
    } finally {
      this.savedLoading.set(false);
    }
  }

  refreshSaved(): void {
    this.savedLoaded = false;
    if (this.isLoggedIn()) this.fetchSavedPods();
  }

  async fetchProfile(userId: string): Promise<SocialProfile | null> {
    if (!this.isLoggedIn()) return null;
    try {
      const res = await lastValueFrom(this.http.get<{ success: boolean; data: SocialProfile }>(
        `${this.API_URL}/social/profile/${userId}`,
        this.headers()
      ));
      return res.success ? res.data : null;
    } catch {
      return null;
    }
  }

  async fetchFollowers(userId: string, page = 1, limit = 20): Promise<{ items: SocialUserRow[]; total: number }> {
    if (!this.isLoggedIn()) return { items: [], total: 0 };
    try {
      const res = await lastValueFrom(this.http.get<{ success: boolean; data: { items: SocialUserRow[]; total: number } }>(
        `${this.API_URL}/social/followers?userId=${userId}&page=${page}&limit=${limit}`,
        this.headers()
      ));
      return res.success ? res.data : { items: [], total: 0 };
    } catch {
      return { items: [], total: 0 };
    }
  }

  async fetchFollowingUsers(userId: string, page = 1, limit = 20): Promise<{ items: SocialUserRow[]; total: number }> {
    if (!this.isLoggedIn()) return { items: [], total: 0 };
    try {
      const res = await lastValueFrom(this.http.get<{ success: boolean; data: { items: SocialUserRow[]; total: number } }>(
        `${this.API_URL}/social/following-list?userId=${userId}&page=${page}&limit=${limit}`,
        this.headers()
      ));
      return res.success ? res.data : { items: [], total: 0 };
    } catch {
      return { items: [], total: 0 };
    }
  }

  async fetchCreatorCodes(userId: string, page = 1, limit = 12): Promise<{ items: CodePost[]; total: number }> {
    if (!this.isLoggedIn()) return { items: [], total: 0 };
    try {
      const res = await lastValueFrom(this.http.get<{ success: boolean; data: { items: CodePost[]; total: number } }>(
        `${this.API_URL}/social/creator-codes?userId=${userId}&page=${page}&limit=${limit}`,
        this.headers()
      ));
      if (!res.success) return { items: [], total: 0 };
      return { items: res.data.items || [], total: res.data.total || 0 };
    } catch {
      return { items: [], total: 0 };
    }
  }

  async toggleFollow(creator: string): Promise<string> {
    if (!creator) return 'You are always following Ora';
    const oraId = this.oraId();
    const isOra = creator === oraId || creator === 'ora';
    if (isOra) {
      if (!this.isLoggedIn()) return 'You are always following Ora — it cannot be turned off';
      try {
        await lastValueFrom(this.http.post<{ success: boolean; data: ToggleFollowData }>(
          `${this.API_URL}/social/follows/toggle`,
          { creatorId: oraId || creator },
          this.headers()
        ));
      } catch {
        // server keeps the lock regardless
      }
      return 'You are always following Ora — it cannot be turned off';
    }
    const wasFollowing = this.follows().includes(creator);
    this.follows.update(cur => wasFollowing ? cur.filter(x => x !== creator) : [...cur, creator]);
    this.updateCreatorFollow(creator, !wasFollowing);
    if (!this.isLoggedIn()) {
      this.persist();
      return '';
    }
    try {
      const res = await lastValueFrom(this.http.post<{ success: boolean; data: ToggleFollowData }>(
        `${this.API_URL}/social/follows/toggle`,
        { creatorId: creator },
        this.headers()
      ));
      if (res.success && res.data) {
        this.follows.update(cur => res.data.following ? (cur.includes(creator) ? cur : [...cur, creator]) : cur.filter(x => x !== creator));
        this.updateCreatorFollow(creator, res.data.following);
      }
      this.refreshFollowingFeed();
      return '';
    } catch (error) {
      this.follows.update(cur => wasFollowing ? [...cur, creator] : cur.filter(x => x !== creator));
      this.updateCreatorFollow(creator, wasFollowing);
      throw error;
    }
  }

  private updateCreatorFollow(creator: string, following: boolean) {
    this.creators.update(list => list.map(c => c.id === creator ? { ...c, isFollowing: following } : c));
  }

  async toggleLike(podId: string): Promise<void> {
    const wasLiked = this.isLiked(podId);
    this.likes.update(cur => wasLiked ? cur.filter(x => x !== podId) : [...cur, podId]);
    if (!this.isLoggedIn()) {
      this.persist();
      return;
    }
    try {
      const res = await lastValueFrom(this.http.post<{ success: boolean; data: ToggleLikeData }>(
        `${this.API_URL}/social/likes/toggle`,
        { podId },
        this.headers()
      ));
      if (res.success && res.data) {
        this.serverLikeCounts.update(cur => ({ ...cur, [podId]: res.data.count }));
      }
    } catch (error) {
      this.likes.update(cur => wasLiked ? [...cur, podId] : cur.filter(x => x !== podId));
      throw error;
    }
  }

  async toggleSave(podId: string): Promise<void> {
    const wasSaved = this.isSaved(podId);
    this.saves.update(cur => wasSaved ? cur.filter(x => x !== podId) : [...cur, podId]);
    if (!this.isLoggedIn()) {
      this.persist();
      return;
    }
    try {
      const res = await lastValueFrom(this.http.post<{ success: boolean; data: ToggleSaveData }>(
        `${this.API_URL}/social/saves/toggle`,
        { podId },
        this.headers()
      ));
      if (res.success && res.data) {
        this.saves.update(cur => res.data.saved ? (cur.includes(podId) ? cur : [...cur, podId]) : cur.filter(x => x !== podId));
      }
      this.refreshSaved();
    } catch (error) {
      this.saves.update(cur => wasSaved ? [...cur, podId] : cur.filter(x => x !== podId));
      throw error;
    }
  }

  proofText(pod: Pod): string {
    const parts: string[] = [];
    if (pod.currentParticipants > 0) {
      parts.push(`${pod.currentParticipants.toLocaleString()} ${pod.currentParticipants === 1 ? 'person' : 'people'} staked`);
    }
    if (pod.whyRecommended) {
      parts.push('Ora AI pick');
    }
    return parts.join(' · ');
  }

  async sharePod(pod: Pod): Promise<string> {
    const text = `⚡ BetPool pick — ${pod.title || `${pod.homeTeam} v ${pod.awayTeam}`}: ${pod.selection} @ ${pod.gainsMultiplier}x. Staking closes soon.`;
    const url = `${window.location.origin}/home?pod=${pod.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'BetPool pick', text, url });
        return '';
      } catch {
        return '';
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      return 'Pick copied to clipboard — share it anywhere';
    } catch {
      return 'Sharing not available';
    }
  }

  commentsFor(podId: string): SocialComment[] {
    return this.comments()[podId] || [];
  }

  async loadComments(podId: string): Promise<void> {
    if (!this.isLoggedIn()) {
      this.comments.update(cur => ({ ...cur, [podId]: [] }));
      return;
    }
    this.commentsLoading.set(true);
    try {
      const res = await lastValueFrom(this.http.get<{ success: boolean; data: { items: CommentData[]; total: number } }>(
        `${this.API_URL}/social/comments?podId=${podId}&limit=50`,
        this.headers()
      ));
      if (res.success) {
        const items = (res.data.items || []).map(c => ({
          id: c._id,
          podId: String(c.pod),
          authorId: String(c.user?._id ?? ''),
          authorName: c.user?.fullName || 'BetPool user',
          authorUsername: c.user?.username || null,
          text: c.text,
          createdAt: c.createdAt
        }));
        this.comments.update(cur => ({ ...cur, [podId]: items }));
        this.serverCommentCounts.update(cur => ({ ...cur, [podId]: res.data.total }));
      }
    } catch {
      // comments stay empty on failure
    } finally {
      this.commentsLoading.set(false);
    }
  }

  async postComment(podId: string, text: string): Promise<SocialComment | null> {
    const trimmed = (text || '').trim();
    if (!trimmed || !this.isLoggedIn()) return null;
    const me = this.auth.user();
    const temp: SocialComment = {
      id: `temp-${Date.now()}`,
      podId,
      authorId: me?.id || '',
      authorName: me?.fullName || 'You',
      authorUsername: me?.username || null,
      text: trimmed,
      createdAt: new Date().toISOString()
    };
    this.comments.update(cur => ({ ...cur, [podId]: [temp, ...(cur[podId] || [])] }));
    this.serverCommentCounts.update(cur => ({ ...cur, [podId]: (cur[podId] || 0) + 1 }));
    this.commentPosting.set(true);
    try {
      const res = await lastValueFrom(this.http.post<{ success: boolean; data: CommentData }>(
        `${this.API_URL}/social/comments`,
        { podId, text: trimmed },
        this.headers()
      ));
      if (res.success && res.data) {
        const real: SocialComment = {
          id: res.data._id,
          podId: String(res.data.pod),
          authorId: String(res.data.user?._id ?? ''),
          authorName: res.data.user?.fullName || me?.fullName || 'You',
          authorUsername: res.data.user?.username || me?.username || null,
          text: res.data.text,
          createdAt: res.data.createdAt
        };
        this.comments.update(cur => ({
          ...cur,
          [podId]: cur[podId] ? cur[podId].map(c => c.id === temp.id ? real : c) : [real]
        }));
        return real;
      }
      this.comments.update(cur => ({ ...cur, [podId]: (cur[podId] || []).filter(c => c.id !== temp.id) }));
      return null;
    } catch (error) {
      this.comments.update(cur => ({ ...cur, [podId]: (cur[podId] || []).filter(c => c.id !== temp.id) }));
      this.serverCommentCounts.update(cur => ({ ...cur, [podId]: Math.max(0, (cur[podId] || 0) - 1) }));
      throw error;
    } finally {
      this.commentPosting.set(false);
    }
  }
}
