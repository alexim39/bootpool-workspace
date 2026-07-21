import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MatchPoolMarket {
  marketId: string;
  label: string;
  totalStaked: number;
}

export interface AdminMatchPool {
  _id: string;
  eventTitle: string;
  markets: MatchPoolMarket[];
  stakingClosesAt: string;
  status: 'open' | 'staking_closed' | 'settled' | 'cancelled';
  winningMarketId?: string;
  totalPool: number;
  platformFeeAmount: number;
  distributableAmount: number;
  minStake: number;
  maxStake: number;
  createdByAdminId: string;
  createdAt: string;
  settledAt?: string;
  cancelledAt?: string;
}

export interface AdminPoolStake {
  _id: string;
  userId: any;
  matchPoolId: string;
  marketId: string;
  amount: number;
  status: 'confirmed' | 'won' | 'lost' | 'cancelled_refunded';
  payoutAmount: number;
  createdAt: string;
  settledAt?: string;
}

export interface AdminPoolDetail {
  pool: AdminMatchPool;
  marketBreakdown: {
    marketId: string;
    label: string;
    totalStaked: number;
    stakerCount: number;
    stakes: AdminPoolStake[];
  }[];
  totalStakes: number;
}

export interface PoolReport {
  eventTitle: string;
  status: string;
  totalPool: number;
  platformFeeAmount: number;
  distributableAmount: number;
  winningMarketId?: string;
  totalStakers: number;
  totalWinners: number;
  marketBreakdown: {
    marketId: string;
    label: string;
    totalStaked: number;
    stakerCount: number;
    winners: number;
  }[];
  settledAt?: string;
  cancelledAt?: string;
}

export interface PoolReportsAgg {
  totalSettled: number;
  totalFeeRevenue: number;
  avgPoolSize: number;
  uniqueStakers: number;
  pools: { _id: string; eventTitle: string; totalPool: number; platformFeeAmount: number; settledAt?: string }[];
}

@Injectable({ providedIn: 'root' })
export class AdminMatchPoolService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin/match-pools`;

  list(params?: { page?: number; limit?: number; status?: string }): Observable<{ success: boolean; data: { items: AdminMatchPool[]; total: number; page: number; totalPages: number } }> {
    let hp = new HttpParams();
    if (params?.page) hp = hp.set('page', params.page);
    if (params?.limit) hp = hp.set('limit', params.limit);
    if (params?.status) hp = hp.set('status', params.status);
    return this.http.get<any>(this.baseUrl, { params: hp });
  }

  create(data: { eventTitle: string; markets: { marketId: string; label: string }[]; stakingClosesAt: string; minStake?: number; maxStake?: number }): Observable<{ success: boolean; data: AdminMatchPool }> {
    return this.http.post<any>(this.baseUrl, data);
  }

  getDetail(id: string): Observable<{ success: boolean; data: AdminPoolDetail }> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  getReport(id: string): Observable<{ success: boolean; data: PoolReport }> {
    return this.http.get<any>(`${this.baseUrl}/${id}/report`);
  }

  closeStaking(id: string): Observable<{ success: boolean; data: AdminMatchPool; message: string }> {
    return this.http.post<any>(`${this.baseUrl}/${id}/close-staking`, {});
  }

  settle(id: string, winningMarketId: string): Observable<{ success: boolean; data: AdminMatchPool; message: string }> {
    return this.http.post<any>(`${this.baseUrl}/${id}/settle`, { winningMarketId });
  }

  cancel(id: string): Observable<{ success: boolean; data: AdminMatchPool; message: string }> {
    return this.http.post<any>(`${this.baseUrl}/${id}/cancel`, {});
  }

  getReports(params?: { from?: string; to?: string }): Observable<{ success: boolean; data: PoolReportsAgg }> {
    let hp = new HttpParams();
    if (params?.from) hp = hp.set('from', params.from);
    if (params?.to) hp = hp.set('to', params.to);
    return this.http.get<any>(`${this.baseUrl}/reports`, { params: hp });
  }
}
