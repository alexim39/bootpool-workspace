import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BetManagerStore } from './bet-manager.store';
import { BetManagerService, BetHistoryPage } from '../services/bet-manager.service';

describe('BetManagerStore bet history tab', () => {
  let store: BetManagerStore;
  let api: jasmine.SpyObj<BetManagerService>;

  const page = (overrides: Partial<BetHistoryPage> = {}): { success: boolean; data: BetHistoryPage } => ({
    success: true,
    data: {
      bets: [
        {
          _id: 'alloc-1', podId: 'pod-1',
          homeTeam: 'Arsenal', awayTeam: 'Chelsea', league: 'Premier League',
          selection: 'Home Win', marketType: '1X2', homeScore: 2, awayScore: 0,
          matchDate: null, odds: 1.5, amount: 1000, status: 'won',
          returns: 1450, placedAt: new Date().toISOString(), settledAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      stats: { active: 0, won: 1, lost: 0, void: 0, refunded: 0 },
      ...overrides,
    },
  });

  beforeEach(() => {
    api = jasmine.createSpyObj('BetManagerService', ['getBetHistory', 'getDepositHistory']);
    api.getBetHistory.and.returnValue(of(page()));
    api.getDepositHistory.and.returnValue(of({ success: true, data: { deposits: [], total: 0, page: 1, limit: 10 } }));

    TestBed.configureTestingModule({
      providers: [{ provide: BetManagerService, useValue: api }],
    });
    store = TestBed.inject(BetManagerStore);
    store.selectedTier.set('academy');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('defaults to the funds tab with empty bet state', () => {
    expect(store.historyTab()).toBe('funds');
    expect(store.betHistory()).toEqual([]);
    expect(store.betTotal()).toBe(0);
  });

  it('lazy-loads bet history on first switch to the bets tab', () => {
    store.setHistoryTab('bets');

    expect(api.getBetHistory).toHaveBeenCalledWith('academy', jasmine.objectContaining({ page: 1, limit: 10 }));
    expect(store.betHistory().length).toBe(1);
    expect(store.betTotal()).toBe(1);
    expect(store.betStats()['won']).toBe(1);
  });

  it('does not refetch when re-selecting the active tab', () => {
    store.setHistoryTab('bets');
    const calls = api.getBetHistory.calls.count();

    store.setHistoryTab('bets');

    expect(api.getBetHistory.calls.count()).toBe(calls);
  });

  it('resets to page 1 when bet filters change', () => {
    store.setHistoryTab('bets');
    store.loadBetPage(3);

    store.setBetFilters({ status: 'won' });

    expect(store.betPage()).toBe(1);
    expect(store.betStatus()).toBe('won');
    expect(api.getBetHistory).toHaveBeenCalledWith('academy', jasmine.objectContaining({ status: 'won', page: 1 }));
  });

  it('clears bet filters back to defaults', () => {
    store.setHistoryTab('bets');
    store.setBetFilters({ status: 'lost' });

    store.clearBetFilters();

    expect(store.betStatus()).toBe('');
    expect(store.betSortField()).toBe('placedAt');
    expect(store.betSortOrder()).toBe('desc');
  });

  it('clamps bet pagination to the last page', () => {
    store.setHistoryTab('bets');

    store.loadBetPage(99);

    expect(store.betPage()).toBe(1);
  });
});
