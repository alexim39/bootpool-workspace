import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PodService, Pod } from '../../../core/services';
import { StakeService, PlaceAccumulatorRequest } from '../../../core/services';
import { WalletService } from '../../../core/services';
import { AuthService } from '../../../core/services';
import { OraRecordService, OraRecord } from '../../../core/services';

@Injectable({ providedIn: 'root' })
export class HomeStore implements OnDestroy {
  readonly pods = inject(PodService);
  readonly auth = inject(AuthService);
  private _stake = inject(StakeService);
  private _wallet = inject(WalletService);
  private _oraRecord = inject(OraRecordService);

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
    const pods = this.activePods();
    const personalized = this.pods.personalized();
    if (personalized) return pods;
    return [...pods].sort((a, b) =>
      new Date(a.stakingClosesAt).getTime() - new Date(b.stakingClosesAt).getTime()
    );
  });
  readonly hasSearchResults = computed(() => this.isSearching() && !this.pods.loading() && this.displayedPods().length > 0);
  readonly noSearchResults = computed(() => this.isSearching() && !this.pods.loading() && this.displayedPods().length === 0);

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

  toggleSelection(pod: Pod) {
    if (!this.auth.isAuthenticated()) return;

    this.betSlipSelections.update(selected => {
      const exists = selected.find(s => s.id === pod.id);
      if (exists) {
        return selected.filter(s => s.id !== pod.id);
      }
      if (selected.length >= environment.maxAccumulatorLegs) {
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
    return this.betSlipSelections().length >= environment.maxAccumulatorLegs;
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
}
