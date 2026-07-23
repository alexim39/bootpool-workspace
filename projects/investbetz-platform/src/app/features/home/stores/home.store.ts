import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { PodService, Pod } from '../../../core/services';
import { StakeService, PlaceAccumulatorRequest } from '../../../core/services';
import { WalletService } from '../../../core/services';
import { AuthService } from '../../../core/services';

@Injectable({ providedIn: 'root' })
export class HomeStore implements OnDestroy {
  readonly pods = inject(PodService);
  readonly auth = inject(AuthService);
  private _stake = inject(StakeService);
  private _wallet = inject(WalletService);

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
  readonly displayedPods = computed(() => {
    const pods = this.activePods();
    return [...pods].sort((a, b) =>
      new Date(a.stakingClosesAt).getTime() - new Date(b.stakingClosesAt).getTime()
    );
  });
  readonly hasSearchResults = computed(() => this.isSearching() && !this.pods.loading() && this.displayedPods().length > 0);
  readonly noSearchResults = computed(() => this.isSearching() && !this.pods.loading() && this.displayedPods().length === 0);

  private readonly PAGE_SIZE = 5;

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

  init() {
    this.pods.fetchFeed({ limit: this.PAGE_SIZE });
    this.pods.fetchUpcoming({ limit: 10 });
    this.pods.fetchSports();
    this._wallet.fetchBalance();
    this._stake.fetchActiveStakes();
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    this.search$.next(value);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.pods.fetchFeed({
      limit: this.PAGE_SIZE,
      sport: this.selectedSport() ?? undefined
    });
  }

  selectSport(sport: string | null) {
    this.selectedSport.set(sport);
    if (this.isSearching()) this.clearSearch();
    this.pods.fetchFeed({ limit: this.PAGE_SIZE, sport: sport ?? undefined });
  }

  onSportChange(index: number) {
    const tabs = ['All', ...this.sports()];
    this.selectSport(index === 0 ? null : tabs[index]);
  }

  loadMore() {
    this.pods.loadMore(this.PAGE_SIZE);
  }

  openStakeModal(pod: Pod) {
    if (!this.auth.isAuthenticated()) return;
    this.selectedPod.set(pod);
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
      if (selected.length >= 5) {
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
    return this.betSlipSelections().length >= 5;
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
