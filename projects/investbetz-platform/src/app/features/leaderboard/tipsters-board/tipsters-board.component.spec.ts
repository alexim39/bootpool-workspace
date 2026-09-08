import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { TipstersBoardComponent } from './tipsters-board.component';
import { LeaderboardService, TipsterBoardPage } from '../../../core/services/leaderboard.service';
import { SocialFeedService } from '../../../core/services/social-feed.service';
import { AuthService } from '../../../core/services';

describe('TipstersBoardComponent', () => {
  let fixture: ComponentFixture<TipstersBoardComponent>;
  let component: TipstersBoardComponent;
  let board: {
    tipsterBoard: ReturnType<typeof signal<TipsterBoardPage | null>>;
    tipsterLoading: ReturnType<typeof signal<boolean>>;
    fetchTipsterBoard: jasmine.Spy;
  };
  let social: jasmine.SpyObj<SocialFeedService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  function page(): TipsterBoardPage {
    return {
      period: 'month',
      page: 1,
      limit: 25,
      total: 1,
      minSettled: 20,
      items: [{
        rank: 1,
        userId: 'creator-1',
        displayName: 'A***e',
        tier: 'Pro',
        settled: 120,
        won: 70,
        winRate: 58.3,
        roi: 12.5,
        profit: 15000,
        totalStaked: 120000
      }]
    };
  }

  beforeEach(async () => {
    board = {
      tipsterBoard: signal<TipsterBoardPage | null>(null),
      tipsterLoading: signal(false),
      fetchTipsterBoard: jasmine.createSpy('fetchTipsterBoard')
    };
    social = jasmine.createSpyObj('SocialFeedService', ['isOraCreator', 'isFollowing', 'toggleFollow']);
    social.isOraCreator.and.returnValue(false);
    social.isFollowing.and.returnValue(false);
    social.toggleFollow.and.resolveTo('');
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [TipstersBoardComponent],
      providers: [
        provideRouter([]),
        { provide: LeaderboardService, useValue: board },
        { provide: SocialFeedService, useValue: social },
        { provide: AuthService, useValue: { user: signal(null) } },
        { provide: MatSnackBar, useValue: snackBar }
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TipstersBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('fetches the board on init with ROI default', () => {
    expect(board.fetchTipsterBoard).toHaveBeenCalledWith('month', 25, 25, 'roi', 'desc');
  });

  it('shows the empty state when no tipsters qualify', () => {
    expect(fixture.nativeElement.textContent).toContain('No ranked tipsters yet');
  });

  it('renders rows with tier, stats, and follow action', () => {
    board.tipsterBoard.set(page());
    fixture.detectChanges();

    const el = fixture.nativeElement;
    expect(el.textContent).toContain('A***e');
    expect(el.textContent).toContain('Pro');
    expect(el.textContent).toContain('58.3%');
    expect(el.textContent).toContain('12.5%');
    expect(el.querySelector('.follow-btn')).toBeTruthy();
  });

  it('switching period and sort refetches', () => {
    component.setPeriod('week');
    expect(board.fetchTipsterBoard).toHaveBeenCalledWith('week', 25, 25, 'roi', 'desc');
    component.setSort('winRate');
    expect(board.fetchTipsterBoard).toHaveBeenCalledWith('week', 25, 25, 'winRate', 'desc');
  });

  it('follow button toggles without navigating', () => {
    board.tipsterBoard.set(page());
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.follow-btn') as HTMLElement;
    btn.click();

    expect(social.toggleFollow).toHaveBeenCalledWith('creator-1');
  });
});
