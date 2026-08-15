import { Injectable, signal, computed, inject, effect, OnDestroy } from '@angular/core';
import { Subject, Subscription, Observable, debounceTime, distinctUntilChanged, finalize, map } from 'rxjs';
import { PodService, Pod } from '../../../core/services';
import { StakeService, PlaceAccumulatorRequest } from '../../../core/services';
import { BookingCodeLeg } from '../../../core/services';
import { WalletService } from '../../../core/services';
import { AuthService } from '../../../core/services';
import { OraRecordService, OraRecord } from '../../../core/services';
import { SocialFeedService } from '../../../core/services';

@Injectable({ providedIn: 'root' })
export class HomeStore implements OnDestroy {
  readonly pods = inject(PodService);
  readonly auth = inject(AuthService);
  private _stake = inject(StakeService);
  private _wallet = inject(WalletService);
  private _oraRecord = inject(OraRecordService);
  private _social = inject(SocialFeedService);

  readonly selectedPod = signal<Pod | null>(null);
  readonly selectedSport = signal<string | null>(null);
  readonly betSlipSelections = signal<Pod[]>([]);
  readonly betSlipOpen = signal(false);
  readonly searchQuery = signal('');

  private search$ = new Subject<string>();
  private searchSub: Subscription;

  readonly sports = this.pods.sports;
  readonly activePods = this.pods.activePods;
  readonly activeBets = this._stake.activeStakes;
  readonly activeBetsCount = computed(() => this.activeBets().length);
  readonly walletBalance = computed(() => this._wallet.balance().available || 0);
  readonly isSearching = computed(() => this.searchQuery().length > 0);

  readonly oraRecord = signal<OraRecord | null>(null);
  readonly oraRecordLoading = signal(false);
  readonly livePods = computed(() => this.pods.livePods());
  readonly upcomingPods = this.pods.upcoming;
  readonly oraWinRate = computed(() => {
    const rec = this.oraRecord();
    if (rec?.overall && rec.overall.played > 0) return Math.round(rec.overall.winRate);
    return null;
  });
  readonly oraPots30d = computed(() => this.oraRecord()?.settledPots30d ?? null);
  readonly oraPayoutAvg = computed(() => this.oraRecord()?.avgPayoutMs ?? null);
  readonly topLeague = computed(() => {
    const stats = this.oraRecord()?.byLeague ?? [];
    const sorted = [...stats].sort((a, b) => b.played - a.played);
    return sorted[0] ?? null;
  });
  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  });
  readonly userFirstName = computed(() => {
    const name = this.auth.user()?.fullName?.trim();
    if (!name) return '';
    return name.split(' ')[0];
  });

  readonly displayedPods = computed(() => {
    return [...this.activePods()];
  });
  readonly hasSearchResults = computed(() => this.isSearching() && !this.pods.loading() && this.displayedPods().length > 0);
  readonly noSearchResults = computed(() => this.isSearching() && !this.pods.loading() && this.displayedPods().length === 0);

  readonly feedMode = signal<'foryou' | 'following' | 'saved'>('foryou');

  setFeedMode(mode: 'foryou' | 'following' | 'saved') {
    this.feedMode.set(mode);
  }

  readonly followingPods = computed(() => {
    return this.displayedPods().filter(p => this._social.isFollowing(this._social.creatorOf(p)));
  });

  readonly savedPods = computed(() => {
    return this.displayedPods().filter(p => this._social.isSaved(p.id));
  });

  readonly feedPods = computed(() => {
    const mode = this.feedMode();
    if (mode === 'following') return this.followingPods();
    if (mode === 'saved') return this.savedPods();
    return this.displayedPods();
  });

  private readonly PAGE_SIZE = 12;

  constructor() {
    this.searchSub = this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(q => {
      if (q.trim()) {
        this.pods.searchPods(q.trim());
      } else {
        this.clearSearch();
      }
    });

    effect(() => {
      this.betSlipSelections();
      this.bookingCode.set(null);
      this.bookingCodeError.set(null);
    });

    effect(() => {
      const pods = this.activePods();
      if (pods.length > 0) this._social.hydrateStats(pods);
    });
  }

  ngOnDestroy() {
    this.searchSub.unsubscribe();
  }

  readonly isLoggedIn = computed(() => this.auth.isAuthenticated());

  init() {
    this.pods.fetchFeed({ limit: this.PAGE_SIZE, personalized: this.isLoggedIn() });
    this.pods.fetchUpcoming({ limit: 12 });
    this.pods.fetchSports();
    this._wallet.fetchBalance();
    this._stake.fetchActiveStakes();
    this.fetchOraRecord();
  }

  fetchOraRecord() {
    if (this.oraRecordLoading()) return;
    this.oraRecordLoading.set(true);
    this._oraRecord.getRecord().subscribe({
      next: (res) => {
        if (res.success) this.oraRecord.set(res.data);
        this.oraRecordLoading.set(false);
      },
      error: () => this.oraRecordLoading.set(false)
    });
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  kickoffLabel(pod: Pod): string {
    if (!pod?.matchDate) return '';
    const date = new Date(pod.matchDate);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff < 0) return 'Kicked off';
    if (diff < 24 * 60 * 60 * 1000) {
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `in ${Math.max(mins, 1)}m`;
      const hours = Math.floor(mins / 60);
      return `in ${hours}h ${mins % 60}m`;
    }
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  isStakable(pod: Pod): boolean {
    return !!pod && pod.status === 'active' && !!pod.isOpen;
  }

  openUpcomingPod(pod: Pod) {
    if (!this.isStakable(pod) || !this.auth.isAuthenticated()) return;
    this.openStakeModal(pod);
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    this.search$.next(value);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.pods.fetchFeed({
      limit: this.PAGE_SIZE,
      sport: this.selectedSport() ?? undefined,
      personalized: this.isLoggedIn()
    });
  }

  selectSport(sport: string | null) {
    this.selectedSport.set(sport);
    if (this.isSearching()) this.clearSearch();
    this.pods.fetchFeed({ limit: this.PAGE_SIZE, sport: sport ?? undefined, personalized: this.isLoggedIn() });
  }

  onSportChange(index: number) {
    this.selectSport(index === 0 ? null : this.sports()[index - 1].sport);
  }

  loadMore() {
    this.pods.loadMore(this.PAGE_SIZE);
  }

  openStakeModal(pod: Pod) {
    if (!this.auth.isAuthenticated()) return;
    this.selectedPod.set(pod);
  }

  openPodById(podId: string) {
    if (!podId || !this.auth.isAuthenticated()) return;
    this.pods.getById(podId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.openStakeModal(res.data);
        }
      },
    });
  }

  closeStakeModal() {
    this.selectedPod.set(null);
  }

  readonly maxAccumulatorLegs = computed(() => this.pods.maxAccumulatorLegs());
  readonly insuranceMinLegs = computed(() => this.pods.insuranceMinLegs());

  toggleSelection(pod: Pod) {
    if (!this.auth.isAuthenticated()) return;

    this.betSlipSelections.update(selected => {
      const exists = selected.find(s => s.id === pod.id);
      if (exists) {
        return selected.filter(s => s.id !== pod.id);
      }
      if (selected.length >= this.maxAccumulatorLegs()) {
        return selected;
      }
      return [...selected, pod];
    });

    if (this.betSlipSelections().length > 0) {
      this.betSlipOpen.set(true);
    }
  }

  toggleSlip() { this.betSlipOpen.update(v => !v); }

  removeFromSlip(podId: string) {
    this.betSlipSelections.update(selected => selected.filter(s => s.id !== podId));
    if (this.betSlipSelections().length === 0) {
      this.betSlipOpen.set(false);
    }
  }

  isSelected(podId: string): boolean {
    return this.betSlipSelections().some(s => s.id === podId);
  }

  isSelectionDisabled(): boolean {
    return this.betSlipSelections().length >= this.maxAccumulatorLegs();
  }

  clearSelections() {
    this.betSlipSelections.set([]);
    this.betSlipOpen.set(false);
  }

  placeAccumulator(data: PlaceAccumulatorRequest) {
    return this._stake.placeAccumulator(data);
  }

  onStakePlaced() {
    this.selectedPod.set(null);
    this._wallet.fetchBalance();
    this._stake.fetchActiveStakes();
  }

  readonly bookingCode = signal<string | null>(null);
  readonly bookingCodeExpiry = signal<string | null>(null);
  readonly bookingCodeLoading = signal(false);
  readonly redeemLoading = signal(false);
  readonly bookingCodeError = signal<string | null>(null);

  clearBookingCode() {
    this.bookingCode.set(null);
    this.bookingCodeExpiry.set(null);
    this.bookingCodeError.set(null);
  }

  createBookingCode() {
    const podIds = this.betSlipSelections().map(s => s.id);
    if (podIds.length < 2 || this.bookingCodeLoading()) return;

    this.bookingCodeLoading.set(true);
    this.bookingCodeError.set(null);
    this._stake.createBookingCode(podIds).subscribe({
      next: (res) => {
        if (res.success && res.data?.code) {
          this.bookingCode.set(res.data.code);
          this.bookingCodeExpiry.set(res.data.expiresAt);
        } else {
          this.bookingCodeError.set(res.message || 'Could not generate booking code');
        }
        this.bookingCodeLoading.set(false);
      },
      error: (err) => {
        this.bookingCodeError.set(err.error?.message || 'Could not generate booking code');
        this.bookingCodeLoading.set(false);
      }
    });
  }

  redeemBookingCode(code: string): Observable<boolean> {
    const trimmed = (code || '').trim();
    this.redeemLoading.set(true);
    this.bookingCodeError.set(null);

    return this._stake.redeemBookingCode(trimmed).pipe(
      finalize(() => this.redeemLoading.set(false)),
      map((res) => {
        const legs = res.data?.legs || [];
        const available = legs.filter(l => l.available);
        if (res.success && available.length > 0) {
          this.betSlipSelections.set(available.map(l => this.mapBookingLegToPod(l)));
          this.betSlipOpen.set(true);
          this.bookingCode.set(null);
          if (available.length < legs.length) {
            this.bookingCodeError.set(
              `${legs.length - available.length} selection(s) already closed — ${available.length} added to slip`
            );
          }
          return true;
        }
        this.bookingCodeError.set(
          res.success
            ? 'None of the selections are still available'
            : (res.message || 'Booking code could not be redeemed')
        );
        return false;
      })
    );
  }

  private mapBookingLegToPod(leg: BookingCodeLeg): Pod {
    const closesAt = leg.stakingClosesAt || new Date().toISOString();
    return {
      id: leg.podId,
      title: `${leg.homeTeam} vs ${leg.awayTeam}`,
      sport: '',
      league: leg.league,
      homeTeam: leg.homeTeam,
      awayTeam: leg.awayTeam,
      matchDate: closesAt,
      selection: leg.selection,
      gainsMultiplier: leg.multiplier,
      impliedProbability: 0,
      minStake: 10,
      maxStake: 5000,
      maxPayout: 0,
      maxTotalExposure: 0,
      currentExposure: 0,
      currentParticipants: 0,
      status: 'active',
      stakingClosesAt: closesAt,
      settlementEstimateLabel: '',
      settlementEstimateAt: new Date().toISOString(),
      openedAt: new Date().toISOString(),
      isLive: false,
      displayOrder: 0,
      legs: [],
      createdBy: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeRemaining: Math.max(0, new Date(closesAt).getTime() - Date.now()),
      isOpen: true,
    };
  }
}
