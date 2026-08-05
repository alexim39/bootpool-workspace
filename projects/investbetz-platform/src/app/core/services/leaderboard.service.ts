import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  board = signal<LeaderboardPage | null>(null);
  myRank = signal<LeaderboardEntry | null>(null);
  lastWin = signal<LastWin | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private getHeaders() {
    return { Authorization: `Bearer ${this.auth.token()}` };
  }

  fetchLeaderboard(period: LeaderboardPeriod, page = 1, limit = 25) {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<{ success: boolean; data: LeaderboardPage }>(
      `${environment.apiUrl}/leaderboard?period=${period}&page=${page}&limit=${limit}`,
      { headers: this.getHeaders() }
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
}
