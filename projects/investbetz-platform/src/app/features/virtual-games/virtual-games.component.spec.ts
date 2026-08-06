import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VirtualGamesComponent } from './virtual-games.component';
import {
  DeviceService,
  VirtualGamesService,
  WalletService,
  VirtualGame,
  PlayResult,
  PlayHistoryItem,
  VirtualGameStats,
} from '../../core/services';
import { AppNavComponent, MobileNavComponent } from '../../core/components';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({ selector: 'app-nav', standalone: true, template: '' })
class MockAppNavComponent {}

@Component({ selector: 'app-mobile-nav', standalone: true, template: '' })
class MockMobileNavComponent {}

const COIN_FLIP: VirtualGame = {
  id: 'coin_flip',
  name: 'Coin Flip',
  description: '',
  icon: 'monetization_on',
  multiplier: 1.9,
  minStake: 100,
  maxStake: 50000,
  outcomes: ['heads', 'tails'],
  rtpPercent: 95,
  enabled: true,
};

const HISTORY_ITEM: PlayHistoryItem = {
  _id: 'h1',
  game: 'coin_flip',
  stakeAmount: 1000,
  multiplier: 1.9,
  result: 'win',
  payoutAmount: 1900,
  outcome: 'heads',
  choice: 'heads',
  playedAt: '2026-01-01T10:00:00Z',
  seed: 'aa',
  verificationHash: 'bb',
};

const RESULT: PlayResult = {
  playId: 'p1',
  game: 'coin_flip',
  choice: 'heads',
  outcome: 'heads',
  result: 'win',
  stakeAmount: 1000,
  multiplier: 1.9,
  payoutAmount: 1900,
  seed: 'seed-value',
  verificationHash: 'hash-value',
  balanceAfter: 9900,
  playedAt: '2026-01-01T10:00:00Z',
};

class MockIntersectionObserver {
  static callbacks: ((entries: any[]) => void)[] = [];
  static last(): ((entries: any[]) => void) {
    return MockIntersectionObserver.callbacks[MockIntersectionObserver.callbacks.length - 1];
  }
  constructor(cb: (entries: any[]) => void) {
    MockIntersectionObserver.callbacks.push(cb);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}

describe('VirtualGamesComponent', () => {
  let fixture: ComponentFixture<VirtualGamesComponent>;
  let component: VirtualGamesComponent;
  let mockIsMobile: ReturnType<typeof signal<boolean>>;
  let mockIsTablet: ReturnType<typeof signal<boolean>>;
  let mockService: any;
  let mockWallet: any;
  let snackbarSpy: jasmine.Spy;

  async function runVerify() {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    mockIsMobile = signal(false);
    mockIsTablet = signal(false);

    mockService = {
      catalog: signal<VirtualGame[]>([COIN_FLIP]),
      history: signal<PlayHistoryItem[]>([]),
      historyTotal: signal(0),
      stats: signal<VirtualGameStats | null>(null),
      loading: signal(false),
      statsLoading: signal(false),
      historyLoading: signal(false),
      playing: signal(false),
      error: signal<string | null>(null),
      fetchCatalog: jasmine.createSpy('fetchCatalog').and.callFake((onLoaded?: () => void) => {
        onLoaded?.();
      }),
      fetchHistory: jasmine.createSpy('fetchHistory'),
      fetchStats: jasmine.createSpy('fetchStats'),
      play: jasmine.createSpy('play'),
      generateIdempotencyKey: jasmine.createSpy('generateIdempotencyKey').and.returnValue('key-1'),
      verifyResult: jasmine.createSpy('verifyResult').and.resolveTo(true),
      donePlaying: jasmine.createSpy('donePlaying'),
      isPlaying: jasmine.createSpy('isPlaying'),
    };

    mockWallet = {
      balance: signal({ available: 5000, locked: 0 }),
      fetchBalance: jasmine.createSpy('fetchBalance'),
    };

    snackbarSpy = jasmine.createSpy('open');

    (window as any).IntersectionObserver = MockIntersectionObserver;
    MockIntersectionObserver.callbacks = [];

    await TestBed.configureTestingModule({
      imports: [VirtualGamesComponent],
      providers: [
        { provide: DeviceService, useValue: { isMobile: mockIsMobile.asReadonly(), isTablet: mockIsTablet.asReadonly() } as Partial<DeviceService> },
        { provide: VirtualGamesService, useValue: mockService },
        { provide: WalletService, useValue: mockWallet },
        { provide: MatSnackBar, useValue: { open: snackbarSpy } },
        { provide: ActivatedRoute, useValue: { snapshot: {} } },
        { provide: Router, useValue: {} },
      ],
    })
      .overrideComponent(VirtualGamesComponent, {
        remove: { imports: [AppNavComponent, MobileNavComponent, MatSnackBarModule] },
        add: { imports: [MockAppNavComponent, MockMobileNavComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(VirtualGamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await runVerify();

    mockService.fetchCatalog.calls.reset();
    mockService.fetchHistory.calls.reset();
    mockService.fetchStats.calls.reset();
    mockWallet.fetchBalance.calls.reset();
    mockService.verifyResult.calls.reset();
  });

  describe('verify() — last-play verification', () => {
    it('sets verified to true when verification passes', async () => {
      component.lastResult.set(RESULT);
      (mockService.verifyResult as jasmine.Spy).and.resolveTo(true);
      component.verify();
      await runVerify();
      expect(component.verifying()).toBeFalse();
      expect(component.verified()).toBeTrue();
    });

    it('sets verified to false when verification fails', async () => {
      component.lastResult.set(RESULT);
      (mockService.verifyResult as jasmine.Spy).and.resolveTo(false);
      component.verify();
      await runVerify();
      expect(component.verified()).toBeFalse();
    });

    it('sets verified to false when verification rejects', async () => {
      component.lastResult.set(RESULT);
      (mockService.verifyResult as jasmine.Spy).and.rejectWith(new Error('boom'));
      component.verify();
      await runVerify();
      expect(component.verified()).toBeFalse();
      expect(component.verifying()).toBeFalse();
    });
  });

  describe('verifyHistoryItem (per-row verify)', () => {
    it('marks a row verified and clears the in-flight id', async () => {
      component.history = signal([HISTORY_ITEM]); // re-assign not needed; service drives
      await runVerify();
      const row = component.history()[0];
      component.verifyHistoryItem(row);
      expect(component.verifyingId()).toBe(row._id);
      await runVerify();
      expect(component.verifiedIds()[row._id]).toBeTrue();
      expect(component.verifyingId()).toBeNull();
    });

    it('skips rows that are already verified', async () => {
      mockService.catalog.set([COIN_FLIP]);
      const item = { ...HISTORY_ITEM };
      component.verifiedIds.update(m => ({ ...m, [item._id]: true }));
      component.verifyHistoryItem(item);
      expect(mockService.verifyResult).not.toHaveBeenCalled();
    });

    it('respects single-flight: ignores calls while another row is verifying', async () => {
      component.verifyingId.set('other');
      component.verifyHistoryItem({ ...HISTORY_ITEM });
      expect(mockService.verifyResult).not.toHaveBeenCalled();
    });

    it('shows a snackbar when the row has no verifiable seed', () => {
      component.verifyHistoryItem({ ...HISTORY_ITEM, seed: undefined, verificationHash: undefined });
      expect(snackbarSpy).toHaveBeenCalled();
      expect(component.verifyingId()).toBeNull();
    });
  });

  describe('infinite scroll onboarding', () => {
    it('loads the next page with append when more data exists', () => {
      mockService.history.set([HISTORY_ITEM]);
      mockService.historyTotal.set(2);
      component.loadMoreHistory();
      expect(component.historyPage()).toBe(2);
      expect(mockService.fetchHistory).toHaveBeenCalledWith(2, 20, 'all', 'all', true);
    });

    it('does not load while a history request is in flight', () => {
      mockService.history.set([HISTORY_ITEM]);
      mockService.historyTotal.set(2);
      mockService.historyLoading.set(true);
      component.loadMoreHistory();
      expect(mockService.fetchHistory).not.toHaveBeenCalled();
    });

    it('does not load when everything has been fetched', () => {
      mockService.history.set([HISTORY_ITEM]);
      mockService.historyTotal.set(1);
      component.loadMoreHistory();
      expect(mockService.fetchHistory).not.toHaveBeenCalled();
    });

    it('exposes hasMore based on loaded vs total', () => {
      mockService.history.set([HISTORY_ITEM, { ...HISTORY_ITEM, _id: 'h2' }]);
      mockService.historyTotal.set(3);
      expect(component.hasMore()).toBeTrue();
      mockService.historyTotal.set(2);
      expect(component.hasMore()).toBeFalse();
    });

    it('fires loadMoreHistory when the sentinel intersects and more data remains', () => {
      mockService.history.set([HISTORY_ITEM]);
      mockService.historyTotal.set(2);
      fixture.detectChanges();
      const cb = MockIntersectionObserver.last();
      expect(cb).toBeTruthy();
      cb([{ isIntersecting: true }]);
      expect(mockService.fetchHistory).toHaveBeenCalledWith(2, 20, 'all', 'all', true);
    });

    it('keeps the sentinel silent when nothing remains to load', () => {
      mockService.history.set([HISTORY_ITEM]);
      mockService.historyTotal.set(1);
      fixture.detectChanges();
      MockIntersectionObserver.last()([{ isIntersecting: true }]);
      expect(mockService.fetchHistory).not.toHaveBeenCalled();
    });
  });

  describe('pull-to-refresh', () => {
    const touchAt = (y: number) => ({ touches: [{ clientY: y }] }) as any;

    beforeEach(() => {
      mockIsMobile.set(true);
      fixture.detectChanges();
    });

    it('starts tracking only on mobile at the top of the page', () => {
      const e = touchAt(120);
      component.onPtrStart(e);
      component.onPtrMove(touchAt(300));
      expect(component.ptrState()).toBe('ready');
    });

    it('ignores pulls when not on mobile', () => {
      mockIsMobile.set(false);
      component.onPtrStart(touchAt(120));
      component.onPtrMove(touchAt(300));
      expect(component.ptrState()).toBe('idle');
    });

    it('shows intermediate pulling state and clamps the offset', () => {
      component.onPtrStart(touchAt(100));
      component.onPtrMove(touchAt(180)); // dy = 80 -> offset 40
      expect(component.ptrState()).toBe('pulling');
      expect(component.ptrOffset()).toBe(40);

      component.onPtrMove(touchAt(500)); // dy = 400 -> offset clamped to 92
      expect(component.ptrState()).toBe('ready');
      expect(component.ptrOffset()).toBe(92);
    });

    it('resets to idle when the finger moves back up', () => {
      component.onPtrStart(touchAt(200));
      component.onPtrMove(touchAt(100)); // dy negative
      expect(component.ptrState()).toBe('idle');
      expect(component.ptrOffset()).toBe(0);
    });

    it('resets to idle when the user has scrolled down the page', () => {
      const original = Object.getOwnPropertyDescriptor(window, 'scrollY');
      Object.defineProperty(window, 'scrollY', { value: 300, configurable: true });
      try {
        component.onPtrStart(touchAt(100));
        component.onPtrMove(touchAt(300));
        expect(component.ptrState()).toBe('idle');
      } finally {
        if (original) Object.defineProperty(window, 'scrollY', original);
      }
    });

    it('triggers a refresh when released at ready state', async () => {
      const deferred: { onLoaded: (() => void) | null } = { onLoaded: null };
      (mockService.fetchCatalog as jasmine.Spy).and.callFake((_onLoaded?: () => void) => {
        deferred.onLoaded = _onLoaded ?? null;
      });
      component.onPtrStart(touchAt(100));
      component.onPtrMove(touchAt(400)); // dy 300 -> ready
      component.onPtrEnd();
      expect(component.ptrState()).toBe('refreshing');
      expect(component.refreshing()).toBeTrue();
      expect(mockService.fetchCatalog).toHaveBeenCalled();
      deferred.onLoaded?.();
      await runVerify();
      expect(component.ptrState()).toBe('idle');
      expect(component.ptrOffset()).toBe(0);
      expect(component.refreshing()).toBeFalse();
    });

    it('cancels back to idle when released before ready', () => {
      component.onPtrStart(touchAt(100));
      component.onPtrMove(touchAt(160)); // dy 60 -> pulling
      component.onPtrEnd();
      expect(component.ptrState()).toBe('idle');
      expect(component.ptrOffset()).toBe(0);
    });
  });

  describe('stake guard rails', () => {
    it('flags stakes below the game minimum', () => {
      component.stakeAmount.set(50);
      expect(component.stakeError()).toContain('Minimum');
    });

    it('flags stakes above the game maximum', () => {
      component.stakeAmount.set(60000);
      expect(component.stakeError()).toContain('Max');
    });

    it('clears the error within the allowed range', () => {
      component.stakeAmount.set(1000);
      expect(component.stakeError()).toBeNull();
    });

    it('clamps the stake into the allowed range', () => {
      component.stakeAmount.set(99999);
      component.clampStake();
      expect(component.stakeAmount()).toBe(50000);

      component.stakeAmount.set(1);
      component.clampStake();
      expect(component.stakeAmount()).toBe(100);
    });
  });
});