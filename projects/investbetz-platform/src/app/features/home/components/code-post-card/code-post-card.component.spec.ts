import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { CodePostCardComponent } from './code-post-card.component';
import { SocialFeedService, CodePost } from '../../../../core/services/social-feed.service';
import { HomeStore } from '../../stores/home.store';

describe('CodePostCardComponent copyStake', () => {
  let fixture: ComponentFixture<CodePostCardComponent>;
  let component: CodePostCardComponent;
  let social: jasmine.SpyObj<SocialFeedService>;
  let store: jasmine.SpyObj<HomeStore>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let undoAction: (() => void) | null;

  function makePost(overrides: Partial<CodePost> = {}): CodePost {
    return {
      kind: 'code',
      id: 'post-1',
      codeId: 'code-1',
      code: 'ABC123',
      creatorId: 'creator-1',
      creatorName: 'Jane Creator',
      boosted: false,
      createdAt: Date.now(),
      expiresAt: null,
      combinedMultiplier: 4.2,
      legCount: 3,
      legs: [
        { podId: 'p1', homeTeam: 'A', awayTeam: 'B', selection: 'Home Win', multiplier: 1.5 },
        { podId: 'p2', homeTeam: 'C', awayTeam: 'D', selection: 'Over 1.5', multiplier: 1.8 },
      ],
      totalLegs: 2,
      stakeAmount: null,
      ...overrides,
    };
  }

  beforeEach(async () => {
    undoAction = null;
    social = jasmine.createSpyObj('SocialFeedService', [
      'isLoggedIn',
      'myId',
      'isFollowing',
      'toggleFollow',
      'likeCountFor',
      'commentCountFor',
      'isLiked',
      'isSaved',
      'toggleLike',
      'toggleSave',
      'loadComments',
      'postComment',
      'commentsFor',
    ]);
    social.isLoggedIn.and.returnValue(true);
    social.myId.and.returnValue('me');
    social.isFollowing.and.returnValue(false);
    social.toggleFollow.and.resolveTo('');
    social.likeCountFor.and.returnValue(0);
    social.commentCountFor.and.returnValue(0);
    social.isLiked.and.returnValue(false);
    social.isSaved.and.returnValue(false);
    social.commentsFor.and.returnValue([]);
    store = jasmine.createSpyObj('HomeStore', ['redeemBookingCode', 'setSlipStakeAmount'], { defaultCopyStake: 500 });
    store.redeemBookingCode.and.returnValue(of(true));
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    snackBar.open.and.returnValue({ onAction: () => ({ subscribe: (fn: () => void) => { undoAction = fn; } }) } as any);

    await TestBed.configureTestingModule({
      imports: [CodePostCardComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: SocialFeedService, useValue: social },
        { provide: HomeStore, useValue: store },
        { provide: MatSnackBar, useValue: snackBar },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CodePostCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('post', makePost());
    fixture.detectChanges();
  });

  it('loads the slip with the preset amount on successful copy', () => {
    component.copyStake();

    expect(store.redeemBookingCode).toHaveBeenCalledWith('ABC123');
    expect(store.setSlipStakeAmount).toHaveBeenCalledWith(500);
    expect(component.staking()).toBe(false);
  });

  it('auto-follows the creator on first copy, with undo', () => {
    component.copyStake();

    expect(social.toggleFollow).toHaveBeenCalledWith('creator-1');
    expect(snackBar.open).toHaveBeenCalledWith(
      jasmine.stringContaining('Following'),
      'Undo',
      jasmine.anything()
    );
    expect(undoAction).not.toBeNull();
    undoAction!();
    expect(social.toggleFollow).toHaveBeenCalledTimes(2);
  });

  it('skips auto-follow when already following', () => {
    social.isFollowing.and.returnValue(true);

    component.copyStake();

    expect(store.setSlipStakeAmount).toHaveBeenCalledWith(500);
    expect(social.toggleFollow).not.toHaveBeenCalled();
  });

  it('skips auto-follow on your own post', () => {
    fixture.componentRef.setInput('post', makePost({ creatorId: 'me' }));
    fixture.detectChanges();

    component.copyStake();

    expect(store.setSlipStakeAmount).toHaveBeenCalledWith(500);
    expect(social.toggleFollow).not.toHaveBeenCalled();
  });

  it('blocks guests with a login prompt', () => {
    social.isLoggedIn.and.returnValue(false);

    component.copyStake();

    expect(store.redeemBookingCode).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Please log in to stake', 'OK', jasmine.anything());
  });

  it('shows an error when redeem fails and presets nothing', () => {
    store.redeemBookingCode.and.returnValue(throwError(() => new Error('nope')));

    component.copyStake();

    expect(store.setSlipStakeAmount).not.toHaveBeenCalled();
    expect(social.toggleFollow).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Could not apply this code', 'OK', jasmine.anything());
  });
});
