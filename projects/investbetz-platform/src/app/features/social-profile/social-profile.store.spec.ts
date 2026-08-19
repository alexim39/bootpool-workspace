import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SocialProfileStore } from './social-profile.store';
import { SocialFeedService, SocialProfile, SocialUserRow, CodePost } from '../../core/services/social-feed.service';

describe('SocialProfileStore', () => {
  let store: SocialProfileStore;
  let social: jasmine.SpyObj<SocialFeedService>;

  const profile: SocialProfile = {
    user: { id: 'creator-1', fullName: 'Jane Creator', isOra: false },
    stats: { codes: 3, followers: 10, following: 2, likesReceived: 5, stakers: 4 },
    achievements: ['first_code', 'rising_creator'],
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

  function codePost(id: string, code: string): CodePost {
    return {
      id,
      codeId: id,
      code,
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
        { podId: 'p3', homeTeam: 'E', awayTeam: 'F', selection: 'Away Win', multiplier: 1.6 },
      ],
      totalLegs: 3,
      stakeAmount: null,
    };
  }

  beforeEach(() => {
    social = jasmine.createSpyObj('SocialFeedService', [
      'fetchProfile',
      'fetchCreatorCodes',
      'fetchFollowers',
      'fetchFollowingUsers',
      'toggleFollow',
      'isFollowing',
    ]);
    social.fetchProfile.and.resolveTo(profile);
    social.fetchCreatorCodes.and.resolveTo({ items: [codePost('c1', 'ABC123'), codePost('c2', 'XYZ789')], total: 2 });
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

  it('loads profile, codes, followers and following in parallel', async () => {
    await store.load('creator-1');

    expect(store.profile()).toEqual(profile);
    expect(store.codes().length).toBe(2);
    expect(store.codesTotal()).toBe(2);
    expect(store.codes()[0].code).toBe('ABC123');
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

  it('loads more codes and tracks hasMore', async () => {
    social.fetchCreatorCodes.and.resolveTo({ items: [codePost('c1', 'ABC123')], total: 3 });
    await store.load('creator-1');
    expect(store.codesHasMore()).toBe(true);

    social.fetchCreatorCodes.and.resolveTo({ items: [codePost('c2', 'XYZ789'), codePost('c3', 'LMN456')], total: 3 });
    await store.loadMoreCodes();
    expect(store.codes().length).toBe(3);
    expect(store.codesHasMore()).toBe(false);
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