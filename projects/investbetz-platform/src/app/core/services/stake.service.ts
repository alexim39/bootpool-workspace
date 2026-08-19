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
  homeScore?: number | null;
  awayScore?: number | null;
}

export interface StakeItem {
  pod: string;
  homeTeam: string;
  awayTeam: string;
  league?: string;
  selection: string;
  gainsMultiplier: number;
  matchDate: string;
  status: 'pending' | 'won' | 'lost' | 'void';
  settledAt?: string;
  homeScore?: number | null;
  awayScore?: number | null;
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
  canCashOut: boolean;
  refundAmount?: number;
  insuranceApplied?: boolean;
  cashoutAmount?: number;
  cashoutFee?: number;
  cashedOutAt?: string;
}

export interface StakesResponse {
  success: boolean;
  data: {
    stakes: Stake[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface StakesQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  from?: string;
  to?: string;
}

export interface ActiveStakesResponse {
  success: boolean;
  data: Stake[];
}

export interface AutoCashoutStatus {
  enabled: boolean;
  targetAmount: number | null;
  triggeredAt: string | null;
  triggerQuote: number | null;
  quote: number;
  maxTarget: number;
}

export interface BetDayStat {
  date: string;
  won: number;
  lost: number;
  played: number;
  staked: number;
  returns: number;
  net: number;
}

export interface BetSummary {
  overall: {
    played: number;
    won: number;
    lost: number;
    void: number;
    cashedOut: number;
    winRate: number;
    totalStaked: number;
    totalReturns: number;
    netPnl: number;
  } | null;
  daily: BetDayStat[];
}

export interface BetSummaryResponse {
  success: boolean;
  data: BetSummary;
}

export interface PlaceStakeRequest {
  podId: string;
  stakeAmount: number;
}

export interface PlaceAccumulatorRequest {
  podIds: string[];
  stakeAmount: number;
  bookingCode?: string;
}

export interface BookingCodeLeg {
  podId: string;
  homeTeam: string;
  awayTeam: string;
  selection: string;
  multiplier: number;
  league?: string;
  status: string;
  available: boolean;
  stakingClosesAt: string | null;
}

export interface BookingCodeResponse {
  success: boolean;
  message?: string;
  data?: {
    code: string;
    codeId?: string;
    expiresAt: string;
    legs?: BookingCodeLeg[];
    combinedMultiplier?: number;
    legCount?: number;
    creator?: { id: string; name: string } | null;
  };
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

  private mapStake(s: any): Stake {
    const id = (s as any)._id || s.id;
    const items: StakeItem[] | undefined = s.items && s.items.length > 0 ? s.items : undefined;
    const lostCount = (items || []).filter(i => i.status === 'lost').length;
    const activeLegs = (items || []).filter(i => i.status !== 'void').length;
    const canCashOut =
      !['won', 'lost', 'void', 'refunded', 'cashed_out', 'cancelled'].includes(s.status) &&
      (Array.isArray(items) && items.length > 1
        ? activeLegs > 0 && lostCount < 2
        : true);
    return {
      ...s,
      id,
      items,
      isParlay: Array.isArray(items) && items.length > 1,
      isSettled: ['won', 'lost', 'void', 'refunded', 'cashed_out'].includes(s.status),
      isActive: ['pending', 'confirmed'].includes(s.status),
      canCashOut,
      profit: s.status === 'won' ? (s.netPayout || 0) - (s.stakeAmount || 0) : s.status === 'lost' ? (s.refundAmount || 0) - (s.stakeAmount || 0) : 0
    };
  }

  fetchMyStakes(queryOrPage: StakesQuery | number = 1, limit = 20, status?: string): Observable<StakesResponse> {
    this.loading.set(true);
    this.error.set(null);

    const opts: StakesQuery =
      typeof queryOrPage === 'number'
        ? { page: queryOrPage, limit, status }
        : queryOrPage;
    const { page = 1, status: st } = opts;

    const query = new URLSearchParams({
      page: String(page),
      limit: String(opts.limit ?? limit),
      ...(st && st !== 'all' && { status: st }),
      ...(opts.search && opts.search.trim() && { search: opts.search.trim() }),
      ...(opts.sortField && { sortField: opts.sortField }),
      ...(opts.sortOrder && { sortOrder: opts.sortOrder }),
      ...(opts.from && { from: opts.from }),
      ...(opts.to && { to: opts.to })
    });

    return new Observable(observer => {
      this.http.get<StakesResponse>(`${environment.apiUrl}/stakes?${query}`, {
        headers: this.getHeaders()
      }).subscribe({
        next: (res) => {
          if (res.success) {
            const mapped = res.data.stakes.map(s => this.mapStake(s));
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
      this.fetchMyStakes({ page: this.currentPage() + 1, limit: 20, status });
    }
  }

  fetchActiveStakes() {
    this.http.get<ActiveStakesResponse>(`${environment.apiUrl}/stakes/active`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        if (res.success) this.activeStakes.set(res.data.map(s => this.mapStake(s)));
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

  getAutoCashout(id: string) {
    return this.http.get<{ success: boolean; data: AutoCashoutStatus }>(
      `${environment.apiUrl}/stakes/${id}/auto-cashout`,
      { headers: this.getHeaders() }
    );
  }

  armAutoCashout(id: string, targetAmount: number) {
    return this.http.post<{ success: boolean; message: string; data: Stake }>(
      `${environment.apiUrl}/stakes/${id}/auto-cashout`,
      { targetAmount },
      { headers: this.getHeaders() }
    );
  }

  disableAutoCashout(id: string) {
    return this.http.delete<{ success: boolean; message: string; data: Stake }>(
      `${environment.apiUrl}/stakes/${id}/auto-cashout`,
      { headers: this.getHeaders() }
    );
  }

  fetchBetSummary(): Observable<BetSummaryResponse> {
    return this.http.get<BetSummaryResponse>(`${environment.apiUrl}/stakes/summary`, {
      headers: this.getHeaders()
    });
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

  createBookingCode(podIds: string[]) {
    return this.http.post<BookingCodeResponse>(
      `${environment.apiUrl}/stakes/booking-codes`,
      { podIds },
      { headers: this.getHeaders() }
    );
  }

  redeemBookingCode(code: string) {
    return this.http.get<BookingCodeResponse>(
      `${environment.apiUrl}/stakes/booking-codes/${encodeURIComponent(code)}`,
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