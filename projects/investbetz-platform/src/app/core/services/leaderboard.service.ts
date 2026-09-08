import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export type LeaderboardPeriod = 'week' | 'month' | 'all';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalStaked: number;
  stakeCount: number;
  totalWon: number;
  lastWinAt: string | null;
}

export interface LeaderboardPage {
  period: LeaderboardPeriod;
  page: number;
  limit: number;
  total: number;
  items: LeaderboardEntry[];
}

export interface LastWin {
  podTitle: string;
  netPayout: number;
  multiplier: number;
  settledAt: string;
}

export type TipsterSortField = 'roi' | 'winRate' | 'settled' | 'profit';

export interface TipsterBoardEntry {
  rank: number;
  userId: string;
  displayName: string;
  tier: 'Rookie' | 'Rising' | 'Pro' | 'Legend';
  settled: number;
  won: number;
  winRate: number;
  roi: number;
  profit: number;
  totalStaked: number;
}

export interface TipsterBoardPage {
  period: LeaderboardPeriod;
  page: number;
  limit: number;
  total: number;
  minSettled: number;
  items: TipsterBoardEntry[];
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  board = signal<LeaderboardPage | null>(null);
  myRank = signal<LeaderboardEntry | null>(null);
  lastWin = signal<LastWin | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  tipsterBoard = signal<TipsterBoardPage | null>(null);
  tipsterLoading = signal(false);
  tipsterError = signal<string | null>(null);

  private getHeaders() {
    return { Authorization: `Bearer ${this.auth.token()}` };
  }

  fetchLeaderboard(
    period: LeaderboardPeriod = 'month',
    page = 1,
    limit = 25,
    search = '',
    sortField: 'totalStaked' | 'stakeCount' | 'totalWon' | 'lastWinAt' = 'totalStaked',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('period', period)
      .set('page', String(page))
      .set('limit', String(limit))
      .set('sortField', sortField)
      .set('sortOrder', sortOrder);
    if (search.trim()) params = params.set('search', search.trim());

    this.http.get<{ success: boolean; data: LeaderboardPage }>(
      `${environment.apiUrl}/leaderboard`,
      { headers: this.getHeaders(), params }
    ).subscribe({
      next: (res) => {
        if (res.success) this.board.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load leaderboard');
        this.loading.set(false);
      }
    });
  }

  fetchMyRank(period: LeaderboardPeriod) {
    this.http.get<{ success: boolean; data: LeaderboardEntry | null }>(
      `${environment.apiUrl}/leaderboard/me?period=${period}`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        if (res.success) this.myRank.set(res.data);
      },
      error: () => {}
    });
  }

  fetchLastWin(): Observable<{ success: boolean; data: LastWin | null }> {
    return this.http.get<{ success: boolean; data: LastWin | null }>(
      `${environment.apiUrl}/leaderboard/me/last-win`,
      { headers: this.getHeaders() }
    );
  }

  fetchTipsterBoard(
    period: LeaderboardPeriod = 'month',
    page = 1,
    limit = 25,
    sortField: TipsterSortField = 'roi',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    this.tipsterLoading.set(true);
    this.tipsterError.set(null);

    const params = new HttpParams()
      .set('period', period)
      .set('page', String(page))
      .set('limit', String(limit))
      .set('sortField', sortField)
      .set('sortOrder', sortOrder);

    this.http.get<{ success: boolean; data: TipsterBoardPage }>(
      `${environment.apiUrl}/leaderboard/tipsters`,
      { headers: this.getHeaders(), params }
    ).subscribe({
      next: (res) => {
        if (res.success) this.tipsterBoard.set(res.data);
        this.tipsterLoading.set(false);
      },
      error: (err) => {
        this.tipsterError.set(err.error?.message || 'Failed to load tipster board');
        this.tipsterLoading.set(false);
      }
    });
  }
}
