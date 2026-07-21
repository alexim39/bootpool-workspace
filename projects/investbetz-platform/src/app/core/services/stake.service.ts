import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { PollingService } from './polling.service';

export interface PodRef {
  id: string;
  title: string;
  sport: string;
  league?: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  selection: string;
  marketType?: string;
  gainsMultiplier: number;
  refundPercent?: number;
  minStake: number;
  maxStake: number;
  maxPayout: number;
  status: string;
  opensAt: string;
  stakingClosesAt: string;
  isLive: boolean;
}

export interface StakeItem {
  pod: string;
  homeTeam: string;
  awayTeam: string;
  selection: string;
  gainsMultiplier: number;
  matchDate: string;
  status: 'pending' | 'won' | 'lost' | 'void';
  settledAt?: string;
}

export interface Stake {
  id: string;
  podId: string;
  pod: PodRef;
  items?: StakeItem[];
  combinedMultiplier?: number;
  stakeAmount: number;
  potentialPayout: number;
  netPayout: number;
  platformFee: number;
  feePercent: number;
  status: 'pending' | 'confirmed' | 'won' | 'lost' | 'void' | 'refunded' | 'cancelled' | 'cashed_out';
  createdAt: string;
  settledAt?: string;
  profit: number;
  isActive: boolean;
  isSettled: boolean;
  isParlay: boolean;
  cashoutAmount?: number;
  cashoutFee?: number;
  cashedOutAt?: string;
}

export interface StakesResponse {
  success: boolean;
  data: {
    stakes: Stake[];
    total: number;
  };
}

export interface ActiveStakesResponse {
  success: boolean;
  data: Stake[];
}

export interface PlaceStakeRequest {
  podId: string;
  stakeAmount: number;
}

export interface PlaceAccumulatorRequest {
  podIds: string[];
  stakeAmount: number;
}

export interface PlaceStakeResponse {
  success: boolean;
  message?: string;
  data?: {
    stake: Stake;
    potentialPayout: number;
    netPayout: number;
    platformFee: number;
  };
}

export interface CalculatePayoutResponse {
  success: boolean;
  data?: {
    potentialPayout: number;
    platformFee: number;
    netPayout: number;
    minStake: number;
    maxStake: number;
  };
}

@Injectable({ providedIn: 'root' })
export class StakeService {
  stakes = signal<Stake[]>([]);
  activeStakes = signal<Stake[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  totalStakes = signal(0);
  currentPage = signal(1);

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private polling: PollingService
  ) {}

  private getHeaders() {
    return { Authorization: `Bearer ${this.auth.token()}` };
  }

  fetchMyStakes(page = 1, limit = 20, status?: string): Observable<StakesResponse> {
    this.loading.set(true);
    this.error.set(null);

    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(status && { status })
    });

    return new Observable(observer => {
      this.http.get<StakesResponse>(`${environment.apiUrl}/stakes?${query}`, {
        headers: this.getHeaders()
      }).subscribe({
        next: (res) => {
          if (res.success) {
            const mapped = res.data.stakes.map(s => ({ ...s, id: (s as any)._id || s.id }));
            if (page === 1) this.stakes.set(mapped);
            else this.stakes.update(s => [...s, ...mapped]);
            this.totalStakes.set(res.data.total);
            this.currentPage.set(page);
            observer.next({ ...res, data: { ...res.data, stakes: mapped } });
          } else {
            observer.next(res);
          }
          this.loading.set(false);
          observer.complete();
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to fetch stakes');
          this.loading.set(false);
          observer.error(err);
        }
      });
    });
  }

  loadMoreStakes(status?: string) {
    if (this.stakes().length < this.totalStakes() && !this.loading()) {
      this.fetchMyStakes(this.currentPage() + 1, 20, status);
    }
  }

  fetchActiveStakes() {
    this.http.get<ActiveStakesResponse>(`${environment.apiUrl}/stakes/active`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        if (res.success) this.activeStakes.set(res.data.map(s => ({ ...s, id: (s as any)._id || s.id })));
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to fetch active stakes');
      }
    });
  }

  startActiveStakesPolling() {
    this.polling.start('active-stakes', () => this.fetchActiveStakes(), 30000);
  }

  stopActiveStakesPolling() {
    this.polling.stop('active-stakes');
  }

  getStakeById(id: string) {
    return this.http.get<{ success: boolean; data: Stake }>(
      `${environment.apiUrl}/stakes/${id}`,
      { headers: this.getHeaders() }
    );
  }

  placeStake(data: PlaceStakeRequest) {
    return this.http.post<PlaceStakeResponse>(`${environment.apiUrl}/stakes`, data, {
      headers: this.getHeaders()
    });
  }

  placeAccumulator(data: PlaceAccumulatorRequest) {
    return this.http.post<PlaceStakeResponse>(`${environment.apiUrl}/stakes`, data, {
      headers: this.getHeaders()
    });
  }

  calculatePayout(podId: string, stakeAmount: number) {
    return this.http.get<CalculatePayoutResponse>(
      `${environment.apiUrl}/stakes/calculate?podId=${podId}&stakeAmount=${stakeAmount}`,
      { headers: this.getHeaders() }
    );
  }

  getCashoutQuote(stakeId: string) {
    return this.http.get<{ success: boolean; data: { stakeAmount: number; feeAmount: number; payoutAmount: number } }>(
      `${environment.apiUrl}/stakes/${stakeId}/cashout/quote`,
      { headers: this.getHeaders() }
    );
  }

  confirmCashout(stakeId: string) {
    return this.http.post<{ success: boolean; message?: string; data?: { cashoutAmount: number; cashoutFee: number } }>(
      `${environment.apiUrl}/stakes/${stakeId}/cashout/confirm`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getStatusColor(status: Stake['status']): string {
    switch (status) {
      case 'won': return 'success';
      case 'lost':
      case 'refunded': return 'default';
      case 'cashed_out': return 'primary';
      case 'void': return 'warning';
      case 'pending':
      case 'confirmed': return 'primary';
      default: return 'default';
    }
  }

  getStatusIcon(status: Stake['status']): string {
    switch (status) {
      case 'won': return 'check_circle';
      case 'lost':
      case 'refunded': return 'autorenew';
      case 'cashed_out': return 'currency_exchange';
      case 'void': return 'remove_circle';
      case 'pending': return 'schedule';
      case 'confirmed': return 'check';
      default: return 'help';
    }
  }

  formatStatus(status: Stake['status']): string {
    if (status === 'lost') return 'Refunded';
    if (status === 'cashed_out') return 'Cashed Out';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}