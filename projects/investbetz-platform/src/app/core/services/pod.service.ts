import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PodLeg {
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  league?: string;
}

export interface Pod {
  id: string;
  title: string;
  description?: string;
  sport: string;
  league?: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  selection: string;
  gainsMultiplier: number;
  refundPercent?: number;
  impliedProbability: number;
  minStake: number;
  maxStake: number;
  maxPayout: number;
  maxTotalExposure: number;
  currentExposure: number;
  currentParticipants: number;
  status: 'draft' | 'published' | 'active' | 'settled' | 'cancelled' | 'void';
  stakingClosesAt: string;
  settlementEstimateLabel: string;
  settlementEstimateAt: string;
  openedAt: string;
  settledAt?: string;
  result?: 'win' | 'loss' | 'void';
  resultNotes?: string;
  isLive: boolean;
  displayOrder: number;
  tags?: string[];
  metadata?: Record<string, any>;
  legs: PodLeg[];
  createdBy: string;
  updatedBy?: string;
  settledBy?: string;
  createdAt: string;
  updatedAt: string;
  timeRemaining?: number;
  isOpen?: boolean;
}

export interface PodFeedResponse {
  success: boolean;
  data: Pod[];
}

export interface PaginatedPodFeedResponse {
  success: boolean;
  data: {
    items: Pod[];
    total: number;
    hasMore: boolean;
  };
}

export interface PodGainsResponse {
  success: boolean;
  data: {
    gainsMultiplier: number;
    minStake: number;
    maxStake: number;
    maxPayout: number;
    projectedPayout: (stake: number) => number;
  };
}

@Injectable({ providedIn: 'root' })
export class PodService {
  private readonly API_URL = environment.apiUrl;

  pods = signal<Pod[]>([]);
  upcoming = signal<Pod[]>([]);
  sports = signal<string[]>([]);
  loading = signal(false);
  loadingMore = signal(false);
  error = signal<string | null>(null);
  totalPods = signal(0);
  hasMorePods = signal(false);

  activePods = computed(() => 
    this.pods().filter(p => 
      p.status === 'active' && 
      new Date(p.stakingClosesAt) >= new Date() &&
      (p.currentExposure || 0) < (p.maxTotalExposure || 0)
    )
  );

  livePods = computed(() => 
    this.activePods().filter(p => p.isLive)
  );

  preMatchPods = computed(() => 
    this.activePods().filter(p => !p.isLive)
  );

  constructor(private http: HttpClient) {
    effect(() => {
      const interval = setInterval(() => this.updateCountdowns(), 1000);
      return () => clearInterval(interval);
    });
  }

  private updateCountdowns(): void {
    this.pods.update(pods => pods.map(p => ({
      ...p,
      timeRemaining: Math.max(0, new Date(p.stakingClosesAt).getTime() - Date.now()),
      isOpen: new Date(p.stakingClosesAt) >= new Date() && p.status === 'active'
    })));
  }

  private mapPod(p: any): Pod {
    return {
      ...p,
      id: p._id || p.id,
      timeRemaining: Math.max(0, new Date(p.stakingClosesAt).getTime() - Date.now()),
      isOpen: new Date(p.stakingClosesAt) >= new Date() && p.status === 'active'
    };
  }

  fetchFeed(params?: { sport?: string; isLive?: boolean; limit?: number; offset?: number }) {
    const isLoadMore = (params?.offset ?? 0) > 0;
    if (isLoadMore) {
      this.loadingMore.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set(null);
    
    const query = new URLSearchParams();
    if (params?.sport) query.set('sport', params.sport);
    if (params?.isLive !== undefined) query.set('isLive', String(params.isLive));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    this.http.get<PaginatedPodFeedResponse>(`${environment.apiUrl}/pods/feed?${query}`).subscribe({
      next: (res) => {
        if (res.success) {
          const { items, total, hasMore } = res.data;
          const mapped = items.map(p => this.mapPod(p));
          if (isLoadMore) {
            this.pods.update(existing => [...existing, ...mapped]);
          } else {
            this.pods.set(mapped);
          }
          this.totalPods.set(total);
          this.hasMorePods.set(hasMore);
        }
        if (isLoadMore) {
          this.loadingMore.set(false);
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to fetch pods');
        if (isLoadMore) {
          this.loadingMore.set(false);
        } else {
          this.loading.set(false);
        }
      }
    });
  }

  loadMore(pageSize = 20) {
    if (this.loadingMore() || !this.hasMorePods()) return;
    this.fetchFeed({ offset: this.pods().length, limit: pageSize });
  }

  fetchUpcoming(params?: { sport?: string; limit?: number; hoursAhead?: number }) {
    const query = new URLSearchParams();
    if (params?.sport) query.set('sport', params.sport);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.hoursAhead) query.set('hoursAhead', String(params.hoursAhead));

    this.http.get<{ success: boolean; data: Pod[] }>(`${environment.apiUrl}/pods/upcoming?${query}`).subscribe({
      next: (res) => {
        if (res.success) this.upcoming.set(res.data.map(p => ({ ...p, id: (p as any)._id || p.id })));
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to fetch upcoming pods');
      }
    });
  }

  fetchSports() {
    this.http.get<{ success: boolean; data: string[] }>(`${environment.apiUrl}/pods/sports`).subscribe({
      next: (res) => {
        if (res.success) this.sports.set(res.data);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to fetch sports');
      }
    });
  }

  getById(id: string) {
    return this.http.get<{ success: boolean; data: Pod }>(`${environment.apiUrl}/pods/${id}`);
  }

  getGains(id: string) {
    return this.http.get<PodGainsResponse>(`${environment.apiUrl}/pods/${id}/gains`);
  }

  search(query: string, limit = 10) {
    return this.http.get<PodFeedResponse>(`${environment.apiUrl}/pods/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  searchPods(query: string) {
    this.loading.set(true);
    this.error.set(null);
    this.search(query, 50).subscribe({
      next: (res) => {
        if (res.success) {
          this.pods.set(res.data.map(p => this.mapPod(p)));
          this.totalPods.set(res.data.length);
          this.hasMorePods.set(false);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Search failed');
        this.loading.set(false);
      }
    });
  }
}