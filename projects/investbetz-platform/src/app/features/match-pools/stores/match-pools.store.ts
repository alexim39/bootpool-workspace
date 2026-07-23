import { Injectable, inject, signal, computed } from '@angular/core';
import { MatchPoolService, AuthService, MyPoolStake } from '../../../core/services';

type View = 'list' | 'my-stakes';

@Injectable({ providedIn: 'root' })
export class MatchPoolsStore {
  private _service = inject(MatchPoolService);
  private _auth = inject(AuthService);

  readonly pools = computed(() => this._service.pools());
  readonly openPools = computed(() => this._service.openPools());
  readonly loading = computed(() => this._service.loading());
  readonly serviceError = computed(() => this._service.error());

  readonly view = signal<View>('list');
  readonly showGuide = signal(false);
  readonly selectedMarket = signal<string>('');

  readonly mSummary = computed(() => {
    const open = this._service.openPools();
    return {
      open: open.length,
      poolTotal: open.reduce((s, p) => s + p.totalPool, 0),
      myStakes: this.myStakes().length
    };
  });

  stakeAmount = 0;
  readonly staking = signal(false);
  readonly stakeError = signal('');
  readonly stakeSuccess = signal(false);

  readonly myStakes = signal<MyPoolStake[]>([]);
  readonly myStakesLoading = signal(false);

  readonly selectedPoolId = signal<string | null>(null);
  readonly stakeColumns = ['event', 'market', 'amount', 'payout', 'status', 'date'];

  readonly summary = signal({ total: 0, open: 0, poolTotal: 0, myStakes: 0 });

  init() {
    this._service.fetchPools();
    this.computeSummary();
  }

  private computeSummary() {
    const pools = this._service.pools();
    const open = this._service.openPools();
    this.summary.set({
      total: pools.length,
      open: open.length,
      poolTotal: open.reduce((s, p) => s + p.totalPool, 0),
      myStakes: this.myStakes().length
    });
  }

  switchView(v: View) {
    this.view.set(v);
    this.selectedMarket.set('');
    this.stakeAmount = 0;
    this.stakeError.set('');
    this.stakeSuccess.set(false);
    this.selectedPoolId.set(null);
    if (v === 'my-stakes') this.loadMyStakes();
  }

  selectMarketOnPool(poolId: string, marketId: string) {
    this.selectedPoolId.set(poolId);
    this.selectedMarket.set(marketId === this.selectedMarket() ? '' : marketId);
    this.stakeAmount = 0;
    this.stakeError.set('');
    this.stakeSuccess.set(false);
  }

  placeStake(poolId: string) {
    const marketId = this.selectedMarket();
    if (!marketId || !this.stakeAmount) return;
    this.staking.set(true);
    this.stakeError.set('');
    this.stakeSuccess.set(false);

    this._service.stake(poolId, marketId, this.stakeAmount).subscribe({
      next: (res) => {
        if (res.success) {
          this.stakeSuccess.set(true);
          this.stakeAmount = 0;
          this.selectedMarket.set('');
          this.selectedPoolId.set(null);
          this._service.fetchPools();
          this.computeSummary();
          setTimeout(() => this.stakeSuccess.set(false), 3000);
        }
        this.staking.set(false);
      },
      error: (err) => {
        this.stakeError.set(err.error?.message || 'Failed to place stake');
        this.staking.set(false);
        setTimeout(() => this.stakeError.set(''), 5000);
      }
    });
  }

  togglePoolExpand(poolId: string) {
    if (this.selectedPoolId() === poolId) {
      this.selectedPoolId.set(null);
    } else {
      this.selectedPoolId.set(poolId);
    }
    this.selectedMarket.set('');
    this.stakeAmount = 0;
    this.stakeError.set('');
    this.stakeSuccess.set(false);
  }

  onTabChange(event: any) {
    if (event.index === 1) this.loadMyStakes();
  }

  loadMyStakes() {
    this.myStakesLoading.set(true);
    this._service.fetchMyStakes().subscribe({
      next: (res) => {
        if (res.success) {
          this.myStakes.set(res.data.items);
          this.computeSummary();
        }
        this.myStakesLoading.set(false);
      },
      error: () => this.myStakesLoading.set(false)
    });
  }

  logout() {
    this._auth.logout();
  }

  formatMarketName(marketId: string): string {
    return marketId.replace(/_/g, ' ');
  }

  getMarketRank(markets: { marketId: string; totalStaked: number }[], marketId: string): number {
    const sorted = [...markets].sort((a, b) => b.totalStaked - a.totalStaked);
    return sorted.findIndex(m => m.marketId === marketId);
  }
}
