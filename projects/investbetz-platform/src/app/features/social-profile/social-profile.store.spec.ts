import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SocialProfileStore } from './social-profile.store';
import { SocialFeedService, SocialProfile, SocialUserRow } from '../../core/services/social-feed.service';
import { Pod } from '../../core/services';

describe('SocialProfileStore', () => {
  let store: SocialProfileStore;
  let social: jasmine.SpyObj<SocialFeedService>;

  const profile: SocialProfile = {
    user: { id: 'creator-1', fullName: 'Jane Creator', isOra: false },
    stats: { picks: 3, followers: 10, following: 2, likesReceived: 5, stakers: 4 },
    achievements: ['first_pick', 'rising_creator'],
    isSelf: false,
    isFollowing: false,
  };

  const row = (id: string, name: string, overrides: Partial<SocialUserRow> = {}): SocialUserRow => ({
    id,
    fullName: name,
    isOra: false,
    isSelf: false,
    isFollowing: false,
    ...overrides,
  });

  function pod(id: string): Pod {
    return {
      id,
      title: 'Pick ' + id,
      description: '',
      sport: 'Football',
      league: '',
      homeTeam: 'A',
      awayTeam: 'B',
      matchDate: new Date(Date.now() + 86400000).toISOString(),
      selection: 'Home Win',
      gainsMultiplier: 2,
      impliedProbability: 0.5,
      minStake: 100,
      maxStake: 10000,
      maxPayout: 20000,
      maxTotalExposure: 100000,
      currentExposure: 0,
      currentParticipants: 0,
      status: 'active',
      stakingClosesAt: new Date(Date.now() + 3600000).toISOString(),
      settlementEstimateLabel: '',
      settlementEstimateAt: '',
      openedAt: new Date().toISOString(),
      isLive: false,
      displayOrder: 1,
      legs: [],
      createdBy: 'creator-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Pod;
  }

  beforeEach(() => {
    social = jasmine.createSpyObj('SocialFeedService', [
      'fetchProfile',
      'fetchCreatorPicks',
      'fetchFollowers',
      'fetchFollowingUsers',
      'toggleFollow',
      'isFollowing',
    ]);
    social.fetchProfile.and.resolveTo(profile);
    social.fetchCreatorPicks.and.resolveTo({ items: [pod('p1'), pod('p2')], total: 2 });
    social.fetchFollowers.and.resolveTo({ items: [row('u1', 'User One')], total: 1 });
    social.fetchFollowingUsers.and.resolveTo({ items: [row('u2', 'User Two')], total: 1 });
    social.isFollowing.and.returnValue(false);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatSnackBarModule],
      providers: [
        SocialProfileStore,
        { provide: SocialFeedService, useValue: social },
        provideRouter([]),
      ],
    });
    store = TestBed.inject(SocialProfileStore);
  });

  it('loads profile, picks, followers and following in parallel', async () => {
    await store.load('creator-1');

    expect(store.profile()).toEqual(profile);
    expect(store.picks().length).toBe(2);
    expect(store.picksTotal()).toBe(2);
    expect(store.followers().length).toBe(1);
    expect(store.following().length).toBe(1);
    expect(store.loading()).toBe(false);
    expect(social.fetchProfile).toHaveBeenCalledWith('creator-1');
  });

  it('sets an error when profile cannot be loaded', async () => {
    social.fetchProfile.and.resolveTo(null);
    await store.load('creator-1');

    expect(store.error()).toContain('could not be loaded');
    expect(store.profile()).toBeNull();
  });

  it('lazy-loads a tab only when empty', async () => {
    await store.load('creator-1');
    expect(social.fetchFollowers).toHaveBeenCalledTimes(1);

    await store.loadTab('followers');
    expect(social.fetchFollowers).toHaveBeenCalledTimes(1);
  });

  it('loads more picks and tracks hasMore', async () => {
    social.fetchCreatorPicks.and.resolveTo({ items: [pod('p1')], total: 3 });
    await store.load('creator-1');
    expect(store.picksHasMore()).toBe(true);

    social.fetchCreatorPicks.and.resolveTo({ items: [pod('p2'), pod('p3')], total: 3 });
    await store.loadMorePicks();
    expect(store.picks().length).toBe(3);
    expect(store.picksHasMore()).toBe(false);
  });

  it('optimistically toggles follow and reverts on failure', async () => {
    await store.load('creator-1');
    social.toggleFollow.and.rejectWith(new Error('boom'));

    await store.toggleFollow();
    expect(store.profile()!.isFollowing).toBe(false);
  });

  it('updates a user row when following from the list', async () => {
    await store.load('creator-1');
    social.toggleFollow.and.resolveTo('ok');
    social.isFollowing.and.returnValue(true);

    await store.followRow(row('u1', 'User One'));
    expect(store.followers()[0].isFollowing).toBe(true);

    social.isFollowing.and.returnValue(false);
    await store.followRow(row('u1', 'User One'));
    expect(store.followers()[0].isFollowing).toBe(false);
  });
});