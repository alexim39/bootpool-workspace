import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pod } from './pod.service';
import { AuthService } from './auth.service';

const STORAGE_KEY = 'betpool_social_v1';

export interface SocialComment {
  id: string;
  podId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
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

interface CommentData {
  _id: string;
  pod: string;
  user: { _id: string; fullName: string };
  text: string;
  createdAt: string;
}

function loadState(): SocialState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { likes: [], saves: [], follows: ['ora'] };
    const parsed = JSON.parse(raw) as SocialState;
    return {
      likes: Array.isArray(parsed.likes) ? parsed.likes : [],
      saves: Array.isArray(parsed.saves) ? parsed.saves : [],
      follows: Array.isArray(parsed.follows) && parsed.follows.length ? parsed.follows : ['ora'],
    };
  } catch {
    return { likes: [], saves: [], follows: ['ora'] };
  }
}

@Injectable({ providedIn: 'root' })
export class SocialFeedService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

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

  readonly isLoggedIn = computed(() => this.auth.isAuthenticated());

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
    return true;
  }

  likeCount(pod: Pod): number {
    return this.serverLikeCounts()[pod.id] || (this.isLiked(pod.id) ? 1 : 0);
  }

  commentCount(pod: Pod): number {
    return this.serverCommentCounts()[pod.id] || 0;
  }

  async hydrateStats(pods: Pod[]): Promise<void> {
    if (!this.isLoggedIn()) return;
    const ids = pods.map(p => p.id).filter(Boolean);
    if (ids.length === 0) return;
    try {
      const res = await lastValueFrom(this.http.get<{ success: boolean; data: SocialStatsData }>(
        `${this.API_URL}/social/stats?podIds=${ids.join(',')}`,
        this.headers()
      ));
      if (!res.success) return;
      this.serverLikeCounts.set(res.data.likes || {});
      this.serverCommentCounts.set(res.data.comments || {});
      this.likes.set(res.data.liked || []);
      this.saves.set(res.data.saved || []);
    } catch {
      // stats are progressive — keep whatever state exists
    }
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
    } catch (error) {
      this.saves.update(cur => wasSaved ? [...cur, podId] : cur.filter(x => x !== podId));
      throw error;
    }
  }

  async toggleFollow(creator: string): Promise<string> {
    if (!this.isLoggedIn()) return 'Sign in to follow creators';
    return 'You are always following Ora — it cannot be turned off';
  }

  creatorOf(pod: Pod): string {
    return pod.createdBy || 'ora';
  }

  creatorName(creator: string): string {
    return 'Ora';
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
