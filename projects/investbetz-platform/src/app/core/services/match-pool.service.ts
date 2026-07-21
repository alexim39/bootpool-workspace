import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MatchPoolMarket {
  marketId: string;
  label: string;
  totalStaked: number;
}

export interface MatchPool {
  _id: string;
  id: string;
  eventTitle: string;
  markets: MatchPoolMarket[];
  stakingClosesAt: string;
  status: 'open' | 'staking_closed' | 'settled' | 'cancelled';
  totalPool: number;
  platformFeeAmount: number;
  distributableAmount: number;
  minStake: number;
  maxStake: number;
  winningMarketId?: string;
  settledAt?: string;
  cancelledAt?: string;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
  timeRemaining?: number;
  isOpen?: boolean;
}

export interface PoolStakeResponse {
  success: boolean;
  data: {
    stake: {
      _id: string;
      userId: string;
      matchPoolId: string;
      marketId: string;
      amount: number;
      status: string;
      payoutAmount?: number;
      createdAt: string;
    };
    totalPoolStaked: number;
    remainingPool: number;
  };
}

export interface MyPoolStake {
  _id: string;
  matchPoolId: string;
  matchPool: MatchPool | null;
  marketId: string;
  amount: number;
  status: string;
  payoutAmount?: number;
  settledAt?: string;
  createdAt: string;
}

export interface MatchPoolFeedResponse {
  success: boolean;
  data: { items: MatchPool[]; total: number };
}

export interface MyStakesResponse {
  success: boolean;
  data: { items: MyPoolStake[]; total: number };
}

@Injectable({ providedIn: 'root' })
export class MatchPoolService {
  private readonly API_URL = environment.apiUrl;

  pools = signal<MatchPool[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  openPools = computed(() =>
    this.pools().filter(p =>
      p.status === 'open' &&
      new Date(p.stakingClosesAt) >= new Date()
    )
  );

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('ib_token');
    return { Authorization: `Bearer ${token}` };
  }

  fetchPools() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<MatchPoolFeedResponse>(`${this.API_URL}/match-pools`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.pools.set(res.data.items.map(p => ({
            ...p,
            id: (p as any)._id || p.id,
            timeRemaining: Math.max(0, new Date(p.stakingClosesAt).getTime() - Date.now()),
            isOpen: new Date(p.stakingClosesAt) >= new Date() && p.status === 'open'
          })));
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to fetch match pools');
        this.loading.set(false);
      }
    });
  }

  getById(id: string) {
    return this.http.get<{ success: boolean; data: MatchPool }>(
      `${this.API_URL}/match-pools/${id}`,
      { headers: this.getHeaders() }
    );
  }

  stake(poolId: string, marketId: string, amount: number) {
    return this.http.post<PoolStakeResponse>(
      `${this.API_URL}/match-pools/${poolId}/stakes`,
      { marketId, amount },
      { headers: this.getHeaders() }
    );
  }

  fetchMyStakes(page = 1, limit = 20) {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    return this.http.get<MyStakesResponse>(
      `${this.API_URL}/match-pools/my-stakes?${query}`,
      { headers: this.getHeaders() }
    );
  }
}
