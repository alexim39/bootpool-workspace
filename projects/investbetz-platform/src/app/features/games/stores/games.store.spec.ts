import { TestBed } from '@angular/core/testing';
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
    serviceMock = jasmine.createSpyObj('GamesService', ['fetchToday'], {
      games: gamesSignal.asReadonly(),
      loading: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
    });

    TestBed.configureTestingModule({
      providers: [{ provide: GamesService, useValue: serviceMock }],
    });

    store = TestBed.inject(GamesStore);
  });

  it('fetches games once on init', () => {
    serviceMock.fetchToday.and.callFake(() => gamesSignal.set([game()]));
    store.init();
    store.init();
    expect(serviceMock.fetchToday).toHaveBeenCalledTimes(1);
    expect(serviceMock.fetchToday).toHaveBeenCalledWith(3);
  });

  it('filters games by selected league', () => {
    gamesSignal.set([
      game({ fixtureId: 1, league: 'Premier League' }),
      game({ fixtureId: 2, league: 'La Liga' }),
    ]);
    expect(store.filteredGames().length).toBe(2);
    store.selectLeague('La Liga');
    expect(store.filteredGames().length).toBe(1);
    expect(store.filteredGames()[0].fixtureId).toBe(2);
    store.selectLeague('All');
    expect(store.filteredGames().length).toBe(2);
  });

  it('computes leagues with All first', () => {
    gamesSignal.set([
      game({ league: 'La Liga' }),
      game({ league: 'Premier League' }),
      game({ league: 'La Liga' }),
    ]);
    expect(store.leagues()).toEqual(['All', 'La Liga', 'Premier League']);
  });

  it('counts stakable games', () => {
    gamesSignal.set([
      game({ stakable: true }),
      game({ stakable: false }),
      game({ stakable: true }),
    ]);
    expect(store.stakableGames().length).toBe(2);
  });

  it('refresh refetches regardless of cache', () => {
    serviceMock.fetchToday.and.callFake(() => gamesSignal.set([game()]));
    store.init();
    store.refresh();
    expect(serviceMock.fetchToday).toHaveBeenCalledTimes(2);
  });
});
