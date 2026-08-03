import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { GamesStore } from './games.store';
import { GamesService, TodayGame } from '../../../core/services';

function game(overrides: Partial<TodayGame> = {}): TodayGame {
  return {
    fixtureId: 1,
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League',
    matchDate: new Date(Date.now() + 3600000).toISOString(),
    pick: 'Over 2.5',
    marketType: 'Over/Under 2.5',
    gainsMultiplier: 1.85,
    confidence: 72,
    reasoning: 'Both teams score freely.',
    availableOdds: 1.85,
    podId: 'pod-1',
    stakable: true,
    ...overrides,
  };
}

describe('GamesStore', () => {
  let store: GamesStore;
  let serviceMock: jasmine.SpyObj<GamesService>;
  let gamesSignal: ReturnType<typeof signal<TodayGame[]>>;

  beforeEach(() => {
    gamesSignal = signal<TodayGame[]>([]);
    serviceMock = jasmine.createSpyObj('GamesService', ['fetchToday', 'fetchGames'], {
      games: gamesSignal.asReadonly(),
      loading: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      total: signal(0).asReadonly(),
      stakableTotal: signal(0).asReadonly(),
      totalPages: signal(0).asReadonly(),
      currentPage: signal(1).asReadonly(),
      pageSize: signal(25).asReadonly(),
      leagues: signal([] as string[]).asReadonly(),
    });

    TestBed.configureTestingModule({
      providers: [{ provide: GamesService, useValue: serviceMock }],
    });

    store = TestBed.inject(GamesStore);
  });

  it('fetches page 1 with default sort on init', () => {
    serviceMock.fetchGames.and.callFake(() => gamesSignal.set([game()]));
    store.init();
    expect(serviceMock.fetchGames).toHaveBeenCalledTimes(1);
    expect(serviceMock.fetchGames).toHaveBeenCalledWith({
      page: 1,
      limit: 25,
      sortField: 'matchDate',
      sortOrder: 'asc',
      dateFrom: null,
      dateTo: null,
    });
  });

  it('debounces search input by 350ms', fakeAsync(() => {
    serviceMock.fetchGames.and.callFake(() => gamesSignal.set([game()]));
    store.init();
    store.setSearch('a');
    store.setSearch('ar');
    store.setSearch('ars');
    tick(349);
    expect(serviceMock.fetchGames).toHaveBeenCalledTimes(1);
    tick(1);
    expect(serviceMock.fetchGames).toHaveBeenCalledTimes(2);
    expect(serviceMock.fetchGames).toHaveBeenCalledWith(jasmine.objectContaining({ search: 'ars', page: 1 }));
  }));

  it('league filter resets page and reloads', () => {
    serviceMock.fetchGames.and.callFake(() => gamesSignal.set([game()]));
    store.init();
    store.setLeague('La Liga');
    expect(serviceMock.fetchGames).toHaveBeenCalledWith(jasmine.objectContaining({ league: 'La Liga', page: 1 }));
  });

  it('sort toggles order on same field', () => {
    serviceMock.fetchGames.and.callFake(() => gamesSignal.set([game()]));
    store.init();
    store.setSort('confidence');
    expect(serviceMock.fetchGames).toHaveBeenCalledWith(jasmine.objectContaining({ sortField: 'confidence', sortOrder: 'desc' }));
    store.setSort('confidence');
    expect(serviceMock.fetchGames).toHaveBeenCalledWith(jasmine.objectContaining({ sortOrder: 'asc' }));
  });

  it('stakableOnly filter is passed through', () => {
    serviceMock.fetchGames.and.callFake(() => gamesSignal.set([game()]));
    store.init();
    store.setStakableOnly(true);
    expect(serviceMock.fetchGames).toHaveBeenCalledWith(jasmine.objectContaining({ stakableOnly: true }));
  });

  it('clearFilters resets all filters', () => {
    serviceMock.fetchGames.and.callFake(() => gamesSignal.set([game()]));
    store.init();
    store.setSearch('ars');
    store.setLeague('La Liga');
    store.setStakableOnly(true);
    store.clearFilters();
    expect(store.hasActiveFilters()).toBe(false);
    expect(store.searchText()).toBe('');
  });

  it('counts stakable games from current page', () => {
    gamesSignal.set([
      game({ fixtureId: 1, stakable: true }),
      game({ fixtureId: 2, stakable: false }),
      game({ fixtureId: 3, stakable: true }),
    ]);
    expect(store.stakableGames().length).toBe(2);
  });
});
