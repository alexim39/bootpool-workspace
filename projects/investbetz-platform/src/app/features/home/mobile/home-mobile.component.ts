import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { PodService, Pod } from '../../../core/services/pod.service';
import { StakeService } from '../../../core/services/stake.service';
import { WalletService } from '../../../core/services/wallet.service';
import { AuthService } from '../../../core/services/auth.service';
import { PodCardComponent } from '../pod-card.component';
import { StakeModalComponent } from '../stake-modal.component';
import { BetSlipComponent } from '../bet-slip.component';
import { FeaturedBannerComponent } from '../featured-banner.component';
import { TopUpModalComponent } from '../../../core/components/top-up-modal/top-up-modal.component';
import { MobileNavComponent } from '../../../core/components/mobile-nav/mobile-nav.component';

@Component({
  selector: 'app-home-mobile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    PodCardComponent,
    StakeModalComponent,
    BetSlipComponent,
    FeaturedBannerComponent,
    TopUpModalComponent,
    MobileNavComponent
  ],
  templateUrl: './home-mobile.component.html',
  styleUrls: ['./home-mobile.component.scss']
})
export class HomeMobileComponent implements OnInit, OnDestroy {
  private _pods = inject(PodService);
  private _stake = inject(StakeService);
  private _wallet = inject(WalletService);
  _auth = inject(AuthService);
  private _snackBar = inject(MatSnackBar);

  get pods() { return this._pods; }
  get stake() { return this._stake; }
  get wallet() { return this._wallet; }

  showTopUp = signal(false);
  selectedPod = signal<Pod | null>(null);
  selectedSport = signal<string | null>(null);
  betSlipSelections = signal<Pod[]>([]);
  betSlipOpen = signal(false);
  searchQuery = signal('');
  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  sports = computed(() => this.pods.sports());
  activePods = computed(() => this.pods.activePods());
  walletBalance = computed(() => this.wallet.balance().available || 0);
  activeBetsCount = computed(() => this.stake.activeStakes().length);
  isSearching = computed(() => this.searchQuery().length > 0);
  noSearchResults = computed(() => this.isSearching() && !this.pods.loading() && this.displayedPods().length === 0);

  displayedPods = computed(() => {
    const pods = this.activePods();
    return [...pods].sort((a, b) => 
      new Date(a.stakingClosesAt).getTime() - new Date(b.stakingClosesAt).getTime()
    );
  });

  private readonly PAGE_SIZE = 5;

  ngOnInit() {
    this._pods.fetchFeed({ limit: this.PAGE_SIZE });
    this._pods.fetchUpcoming({ limit: 10 });
    this._pods.fetchSports();
    this._wallet.fetchBalance();
    this._stake.fetchActiveStakes();

    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => {
      if (q.trim()) {
        this._pods.searchPods(q.trim());
      } else {
        this.clearSearch();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    this.search$.next(value);
  }

  clearSearch() {
    this.searchQuery.set('');
    this._pods.fetchFeed({
      limit: this.PAGE_SIZE,
      sport: this.selectedSport() ?? undefined
    });
  }

  loadMore() {
    this._pods.loadMore(this.PAGE_SIZE);
  }

  openStakeModal(pod: Pod) {
    if (!this._auth.isAuthenticated()) {
      this._snackBar.open('Please log in to place a stake', 'OK', { duration: 3000 });
      return;
    }
    this.selectedPod.set(pod);
  }

  onSportSelect(sport: string | null) {
    this.selectedSport.set(sport);
    if (this.isSearching()) {
      this.clearSearch();
    }
    this._pods.fetchFeed({ limit: this.PAGE_SIZE, sport: sport ?? undefined });
  }

  closeStakeModal() {
    this.selectedPod.set(null);
  }

  onStakePlaced() {
    this.closeStakeModal();
    this._wallet.fetchBalance();
    this._stake.fetchActiveStakes();
    this._snackBar.open('Stake placed successfully!', 'OK', { duration: 2000 });
  }

  toggleSelection(pod: Pod) {
    if (!this._auth.isAuthenticated()) {
      this._snackBar.open('Please log in to place a stake', 'OK', { duration: 3000 });
      return;
    }

    this.betSlipSelections.update(selected => {
      const exists = selected.find(s => s.id === pod.id);
      if (exists) {
        return selected.filter(s => s.id !== pod.id);
      }
      if (selected.length >= 5) {
        this._snackBar.open('Maximum of 5 selections allowed', 'OK', { duration: 2000 });
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

  onPlaceAccumulator(data: { podIds: string[]; stakeAmount: number }) {
    this._stake.placeAccumulator(data).subscribe({
      next: (res) => {
        if (res.success) {
          this.betSlipSelections.set([]);
          this.betSlipOpen.set(false);
          this._wallet.fetchBalance();
          this._stake.fetchActiveStakes();
          this._snackBar.open('Accumulator placed successfully!', 'OK', { duration: 3000 });
        } else {
          this._snackBar.open(res.message || 'Failed to place accumulator', 'OK', { duration: 3000 });
        }
      },
      error: (err) => {
        this._snackBar.open(err.error?.message || 'Failed to place accumulator', 'OK', { duration: 3000 });
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
