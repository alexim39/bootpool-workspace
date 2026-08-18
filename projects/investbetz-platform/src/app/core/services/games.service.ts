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
  whyRecommended?: string;
  personalizationScore?: number;
}

export interface TodayGamesResponse {
  success: boolean;
  data: {
    items: TodayGame[];
    count: number;
    personalized?: boolean;
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
    personalized?: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class GamesService {
  games = signal<TodayGame[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  personalized = signal(false);

  total = signal(0);
  stakableTotal = signal(0);
  totalPages = signal(0);
  currentPage = signal(1);
  pageSize = signal(25);
  leagues = signal<string[]>([]);

  fixtureResults = signal<TodayGame[]>([]);
  fixtureSearching = signal(false);
  fixtureSearchError = signal<string | null>(null);

  analytics = computed(() => {
    const all = this.games();
    const stakable = all.filter(g => g.stakable).length;
    const avgConf = all.length ? Math.round(all.reduce((s, g) => s + g.confidence, 0) / all.length) : 0;
    return { stakable, avgConf };
  });

  constructor(private http: HttpClient) {}

  fetchToday(days = 1, personalized = false) {
    this.loading.set(true);
    this.error.set(null);
    this.personalized.set(false);
    let params = new HttpParams().set('days', String(days));
    if (personalized) params = params.set('personalized', 'true');
    this.http.get<TodayGamesResponse>(`${environment.apiUrl}/games/today`, { params }).subscribe({
      next: (res) => {
        if (res.success) {
          this.games.set(res.data.items.map(g => ({
            ...g,
            matchDate: new Date(g.matchDate).toISOString(),
          })));
          this.personalized.set(!!res.data.personalized);
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

  searchFixtures(search: string, limit = 10) {
    const term = (search || '').trim();
    this.fixtureSearching.set(true);
    this.fixtureSearchError.set(null);
    if (!term) {
      this.fixtureResults.set([]);
      this.fixtureSearching.set(false);
      return;
    }
    const params = new HttpParams()
      .set('search', term)
      .set('status', 'upcoming')
      .set('limit', String(limit))
      .set('sortField', 'matchDate')
      .set('sortOrder', 'asc');
    this.http.get<GamesListResponse>(`${environment.apiUrl}/games`, { params }).subscribe({
      next: (res) => {
        this.fixtureResults.set(res.success
          ? res.data.items.map(g => ({ ...g, matchDate: new Date(g.matchDate).toISOString() }))
          : []);
        if (!res.success) this.fixtureSearchError.set('Could not search games');
        this.fixtureSearching.set(false);
      },
      error: (err) => {
        this.fixtureSearchError.set(err.error?.message || 'Could not search games');
        this.fixtureSearching.set(false);
      }
    });
  }

  fetchGames(query: GamesQuery = {}, personalized = false) {
    this.loading.set(true);
    this.error.set(null);
    this.personalized.set(false);

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
    if (personalized) params = params.set('personalized', 'true');

    this.http.get<GamesListResponse>(`${environment.apiUrl}/games`, { params }).subscribe({
      next: (res) => {
        if (res.success) {
          const data = res.data;
          this.games.set(data.items.map(g => ({
            ...g,
            matchDate: new Date(g.matchDate).toISOString(),
          })));
          this.personalized.set(!!data.personalized);
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