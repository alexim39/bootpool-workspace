import { Injectable, inject, signal, computed } from '@angular/core';
import { MatchPoolService, AuthService, MatchPool, MyPoolStake } from '../../../core/services';

type View = 'list' | 'my-stakes';

@Injectable({ providedIn: 'root' })
export class MatchPoolsStore {
  private _service = inject(MatchPoolService);
  private _auth = inject(AuthService);

  readonly pools = signal<MatchPool[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly totalPools = signal(0);
  readonly totalPages = signal(0);

  readonly openPools = computed(() =>
    this.pools().filter(p =>
      p.status === 'open' &&
      new Date(p.stakingClosesAt) >= new Date()
    )
  );

  readonly view = signal<View>('list');
  readonly showGuide = signal(false);
  readonly selectedMarket = signal<string>('');

  readonly sortField = signal<string>('createdAt');
  readonly sortOrder = signal<'asc' | 'desc'>('desc');
  readonly fromDate = signal<string>('');
  readonly toDate = signal<string>('');

  readonly mSummary = computed(() => {
    const open = this.openPools();
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

  private computeSummary() {
    const open = this.openPools();
    this.summary.set({
      total: this.totalPools(),
      open: open.length,
      poolTotal: open.reduce((s, p) => s + p.totalPool, 0),
      myStakes: this.myStakes().length
    });
  }

  initPaginated(page = 1, limit = 10) {
    this.fetchPoolsPaginated(page, limit);
  }

  fetchPoolsPaginated(
    page = 1,
    limit = 10,
    search = '',
    status = 'all',
    sort: { field: string; order: 'asc' | 'desc' } = { field: this.sortField(), order: this.sortOrder() },
    range: { from?: string; to?: string } = { from: this.fromDate(), to: this.toDate() }
  ) {
    this.loading.set(true);
    this._service.fetchPools(page, limit, search, status, sort, range).subscribe({
      next: (res) => {
        if (res.success) {
          this.pools.set(res.data.items.map(p => ({
            ...p,
            id: (p as any)._id || p.id,
            timeRemaining: Math.max(0, new Date(p.stakingClosesAt).getTime() - Date.now()),
            isOpen: new Date(p.stakingClosesAt) >= new Date() && p.status === 'open'
          })));
          this.totalPools.set(res.data.total);
          this.totalPages.set(Math.ceil(res.data.total / limit));
          this.computeSummary();
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to fetch match pools');
        this.loading.set(false);
      }
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
          this.fetchPoolsPaginated(1, this._service.lastLimit);
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

  statusMeta(status: string): { label: string; cls: string; icon: string } {
    switch (status) {
      case 'open': return { label: 'Open', cls: 'st-open', icon: 'water_pool' };
      case 'staking_closed': return { label: 'Staking Closed', cls: 'st-closed', icon: 'schedule' };
      case 'settled': return { label: 'Settled', cls: 'st-settled', icon: 'verified_user' };
      case 'cancelled': return { label: 'Cancelled', cls: 'st-cancelled', icon: 'cancel' };
      case 'won': return { label: 'Won', cls: 'st-won', icon: 'emoji_events' };
      case 'lost': return { label: 'Lost', cls: 'st-lost', icon: 'autorenew' };
      case 'confirmed': return { label: 'Confirmed', cls: 'st-confirmed', icon: 'schedule' };
      case 'cancelled_refunded': return { label: 'Refunded', cls: 'st-refunded', icon: 'replay' };
      default: return { label: status, cls: 'st-closed', icon: 'schedule' };
    }
  }

  applySort(field: string, order: 'asc' | 'desc') {
    this.sortField.set(field);
    this.sortOrder.set(order);
  }

  applyDateRange(from: string, to: string) {
    this.fromDate.set(from);
    this.toDate.set(to);
  }
}
