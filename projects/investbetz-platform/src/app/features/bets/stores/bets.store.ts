import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { StakeService, Stake, WalletService, AuthService } from '../../../core/services';

@Injectable({ providedIn: 'root' })
export class BetsStore {
  readonly stakeService = inject(StakeService);
  readonly auth = inject(AuthService);
  private _wallet = inject(WalletService);

  loading = signal(false);
  loadingHistory = signal(false);
  totalStakes = signal(0);
  cashingOutStake = signal<Stake | null>(null);

  readonly activeStakes = this.stakeService.activeStakes;
  readonly activeCount = computed(() => this.activeStakes().length);
  readonly walletBalance = computed(() => this._wallet.balance().available || 0);

  wonCount = signal(0);
  refundedCount = signal(0);
  voidCount = signal(0);
  settledStakes = signal<Stake[]>([]);

  constructor() {
    effect(() => this.loadCounts());
  }

  init() {
    this.stakeService.fetchActiveStakes();
    this.fetchSettledStakes(1);
    this._wallet.fetchBalance();
  }

  private loadCounts() {
    const stakes = this.settledStakes();
    this.wonCount.set(stakes.filter(s => s.status === 'won').length);
    this.refundedCount.set(stakes.filter(s => s.status === 'lost' || s.status === 'refunded').length);
    this.voidCount.set(stakes.filter(s => s.status === 'void' || s.status === 'cancelled').length);
  }

  fetchSettledStakes(page: number) {
    this.loadingHistory.set(true);
    this.stakeService.fetchMyStakes(page, 20, 'settled').subscribe({
      next: (res) => {
        if (res.success) {
          this.settledStakes.set(res.data.stakes);
          this.totalStakes.set(res.data.total);
        }
        this.loadingHistory.set(false);
      },
      error: () => this.loadingHistory.set(false)
    });
  }

  requestCashout(stakeId: string) {
    const stake = this.activeStakes().find(s => s.id === stakeId);
    if (stake && !stake.isParlay) {
      this.cashingOutStake.set(stake);
    }
  }

  dismissCashout() {
    this.cashingOutStake.set(null);
  }

  onCashoutComplete() {
    this.dismissCashout();
    this.stakeService.fetchActiveStakes();
    this.fetchSettledStakes(1);
  }

  onPageChange(pageIndex: number) {
    this.fetchSettledStakes(pageIndex + 1);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDay(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatStatus(status: Stake['status']): string {
    if (status === 'lost') return 'Refunded';
    if (status === 'cashed_out') return 'Cashed Out';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
