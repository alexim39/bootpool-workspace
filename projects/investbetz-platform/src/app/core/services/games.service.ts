import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}

export interface TodayGamesResponse {
  success: boolean;
  data: {
    items: TodayGame[];
    count: number;
  };
}

@Injectable({ providedIn: 'root' })
export class GamesService {
  games = signal<TodayGame[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  leagues = computed(() => {
    const set = new Set<string>();
    for (const g of this.games()) {
      if (g.league) set.add(g.league);
    }
    return ['All', ...Array.from(set).sort()];
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
}
