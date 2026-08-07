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
  data: { items: MatchPool[]; total: number; page: number; limit: number; totalPages: number };
}

export interface MyStakesResponse {
  success: boolean;
  data: { items: MyPoolStake[]; total: number; page: number; limit: number; totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class MatchPoolService {
  private readonly API_URL = environment.apiUrl;

  private _lastLimit = 10;

  get lastLimit() { return this._lastLimit; }

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('ib_token');
    return { Authorization: `Bearer ${token}` };
  }

  fetchPools(
    page = 1,
    limit = 10,
    search = '',
    status = 'all',
    sort: { field: string; order: 'asc' | 'desc' } = { field: 'createdAt', order: 'desc' },
    range: { from?: string; to?: string } = {}
  ) {
    this._lastLimit = limit;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (status && status !== 'all') params.set('status', status);
    if (sort?.field) params.set('sortField', sort.field);
    if (sort?.order) params.set('sortOrder', sort.order);
    if (range?.from) params.set('from', range.from);
    if (range?.to) params.set('to', range.to);
    return this.http.get<MatchPoolFeedResponse>(
      `${this.API_URL}/match-pools?${params}`,
      { headers: this.getHeaders() }
    );
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
