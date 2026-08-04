import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { GameCardComponent } from './game-card.component';
import { TodayGame } from '../../../../core/services';
import { GamesStore } from '../../stores/games.store';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('GameCardComponent', () => {
  let fixture: ComponentFixture<GameCardComponent>;
  let component: GameCardComponent;
  let mockGame: TodayGame;

  function createGame(overrides: Partial<TodayGame> = {}): TodayGame {
    return {
      fixtureId: 1001,
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
      podId: null,
      stakable: false,
      matchStatus: 'notstarted',
      homeScore: null,
      awayScore: null,
      result: null,
      ...overrides,
    };
  }

  beforeEach(async () => {
    mockGame = createGame();
    await TestBed.configureTestingModule({
      imports: [GameCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: GamesStore, useValue: { now: signal(Date.now()) } }],
    }).compileComponents();
    fixture = TestBed.createComponent(GameCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('game', mockGame);
    fixture.detectChanges();
  });

  it('shows the personalized recommendation strip when a reason is present', () => {
    const recGame = createGame({ whyRecommended: 'You often back Arsenal.' });
    const testFixture = TestBed.createComponent(GameCardComponent);
    testFixture.componentRef.setInput('game', recGame);
    testFixture.detectChanges();
    expect(testFixture.componentInstance.recommended()).toBeTrue();
    expect(testFixture.nativeElement.textContent).toContain('You often back Arsenal.');
    testFixture.destroy();
  });

  it('hides the recommendation strip when no reason is present', () => {
    expect(component.recommended()).toBeFalse();
    expect(fixture.nativeElement.textContent).not.toContain('recommend-row');
  });

  it('prefers the personalized reason for the info tooltip', () => {
    const recGame = createGame({
      whyRecommended: 'Your league, your edge.',
      reasoning: 'Ora analysis says high confidence.',
    });
    const testFixture = TestBed.createComponent(GameCardComponent);
    testFixture.componentRef.setInput('game', recGame);
    testFixture.detectChanges();
    expect(testFixture.componentInstance.whyText()).toBe('Your league, your edge.');
    testFixture.destroy();
  });

  it('falls back to Ora reasoning when no personalized reason exists', () => {
    expect(component.whyText()).toBe('Both teams score freely.');
  });
});
