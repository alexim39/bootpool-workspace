import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface TodayGame {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  pick: string;
  marketType: string;
  gainsMultiplier: number;
  confidence: number;
  reasoning: string;
  availableOdds: number;
  podId: string | null;
  stakable: boolean;
  stakeReason?: string;
  matchStatus?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  result?: 'home_win' | 'draw' | 'away_win' | null;
}

export interface TodayGamesResponse {
  success: boolean;
  data: {
    items: TodayGame[];
    count: number;
  };
}

export interface GamesQuery {
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  league?: string;
  marketType?: string;
  stakableOnly?: boolean;
  minConfidence?: number;
  dateFrom?: string | null;
  dateTo?: string | null;
  status?: 'upcoming' | 'live' | 'finished' | 'all';
}

export interface GamesListResponse {
  success: boolean;
  data: {
    items: TodayGame[];
    total: number;
    stakableTotal: number;
    page: number;
    limit: number;
    totalPages: number;
    leagues: string[];
  };
}

@Injectable({ providedIn: 'root' })
export class GamesService {
  games = signal<TodayGame[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  total = signal(0);
  stakableTotal = signal(0);
  totalPages = signal(0);
  currentPage = signal(1);
  pageSize = signal(25);
  leagues = signal<string[]>([]);

  analytics = computed(() => {
    const all = this.games();
    const stakable = all.filter(g => g.stakable).length;
    const avgConf = all.length ? Math.round(all.reduce((s, g) => s + g.confidence, 0) / all.length) : 0;
    return { stakable, avgConf };
  });

  constructor(private http: HttpClient) {}

  fetchToday(days = 1) {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<TodayGamesResponse>(`${environment.apiUrl}/games/today?days=${days}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.games.set(res.data.items.map(g => ({
            ...g,
            matchDate: new Date(g.matchDate).toISOString(),
          })));
        } else {
          this.error.set('Failed to load games');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load games');
        this.loading.set(false);
      }
    });
  }

  fetchGames(query: GamesQuery = {}) {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (query.page) params = params.set('page', String(query.page));
    if (query.limit) params = params.set('limit', String(query.limit));
    if (query.sortField) params = params.set('sortField', query.sortField);
    if (query.sortOrder) params = params.set('sortOrder', query.sortOrder);
    if (query.search) params = params.set('search', query.search);
    if (query.league) params = params.set('league', query.league);
    if (query.marketType) params = params.set('marketType', query.marketType);
    if (query.stakableOnly) params = params.set('stakableOnly', 'true');
    if (query.minConfidence) params = params.set('minConfidence', String(query.minConfidence));
    if (query.dateFrom) params = params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params = params.set('dateTo', query.dateTo);
    if (query.status) params = params.set('status', query.status);

    this.http.get<GamesListResponse>(`${environment.apiUrl}/games`, { params }).subscribe({
      next: (res) => {
        if (res.success) {
          const data = res.data;
          this.games.set(data.items.map(g => ({
            ...g,
            matchDate: new Date(g.matchDate).toISOString(),
          })));
          this.total.set(data.total);
          this.stakableTotal.set(data.stakableTotal);
          this.totalPages.set(data.totalPages);
          this.currentPage.set(data.page);
          this.pageSize.set(data.limit);
          this.leagues.set(data.leagues || []);
        } else {
          this.error.set('Failed to load games');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load games');
        this.loading.set(false);
      }
    });
  }
}