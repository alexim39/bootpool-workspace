import { Injectable, signal } from '@angular/core';
import { Pod } from './pod.service';

const STORAGE_KEY = 'betpool_social_v1';

interface SocialState {
  likes: string[];
  saves: string[];
  follows: string[];
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
  private state = loadState();

  readonly likes = signal<string[]>(this.state.likes);
  readonly saves = signal<string[]>(this.state.saves);
  readonly follows = signal<string[]>(this.state.follows);

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

  isLiked(podId: string): boolean {
    return this.likes().includes(podId);
  }

  isSaved(podId: string): boolean {
    return this.saves().includes(podId);
  }

  isFollowing(creator: string): boolean {
    return this.follows().includes(creator);
  }

  toggleLike(podId: string) {
    this.likes.update(cur => cur.includes(podId) ? cur.filter(x => x !== podId) : [...cur, podId]);
    this.persist();
  }

  toggleSave(podId: string) {
    this.saves.update(cur => cur.includes(podId) ? cur.filter(x => x !== podId) : [...cur, podId]);
    this.persist();
  }

  toggleFollow(creator: string) {
    this.follows.update(cur => cur.includes(creator) ? cur.filter(x => x !== creator) : [...cur, creator]);
    this.persist();
  }

  creatorOf(pod: Pod): string {
    return 'ora';
  }

  creatorName(creator: string): string {
    return creator === 'ora' ? 'Ora' : creator;
  }

  likeCount(pod: Pod): number {
    return this.isLiked(pod.id) ? 1 : 0;
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
}
