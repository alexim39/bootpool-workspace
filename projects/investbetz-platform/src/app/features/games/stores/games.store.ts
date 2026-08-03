import { Injectable, signal, computed, inject } from '@angular/core';
import { GamesService, TodayGame } from '../../../core/services';

@Injectable({ providedIn: 'root' })
export class GamesStore {
  readonly service = inject(GamesService);

  readonly selectedLeague = signal<string | null>(null);

  readonly games = computed(() => this.service.games());
  readonly loading = computed(() => this.service.loading());
  readonly error = computed(() => this.service.error());
  readonly leagues = computed(() => {
    const set = new Set<string>();
    for (const g of this.games()) {
      if (g.league) set.add(g.league);
    }
    return ['All', ...Array.from(set).sort()];
  });

  readonly filteredGames = computed(() => {
    const league = this.selectedLeague();
    if (!league) return this.games();
    return this.games().filter(g => g.league === league);
  });

  readonly stakableGames = computed(() => this.games().filter(g => g.stakable));
  readonly analyzedCount = computed(() => this.games().length);

  init() {
    if (this.games().length === 0) {
      this.service.fetchToday(3);
    }
  }

  selectLeague(league: string | null) {
    this.selectedLeague.set(league === 'All' ? null : league);
  }

  refresh() {
    this.service.fetchToday(3);
  }
}
