import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { WalletService, Transaction, Bank, WithdrawalLimits, StakeService, AuthService } from '../../../core/services';

@Injectable({ providedIn: 'root' })
export class WalletStore {
  readonly walletService = inject(WalletService);
  readonly auth = inject(AuthService);
  private _stake = inject(StakeService);
  private _router = inject(Router);

  transactions = signal<Transaction[]>([]);
  banks = signal<Bank[]>([]);
  withdrawalLimits = signal<WithdrawalLimits>({ min: 500, max: 5000000, dailyLimit: 10000000, fee: '1.5% (max ₦50)' });
  loading = signal(false);
  loadingMore = signal(false);
  totalTransactions = signal(0);
  currentPage = signal(1);

  readonly walletBalance = computed(() => this.walletService.balance());
  readonly totalDeposited = computed(() => this.walletService.balance().totalDeposited || 0);
  readonly totalWithdrawn = computed(() => this.walletService.balance().totalWithdrawn || 0);
  readonly totalStaked = computed(() => this.walletService.balance().totalStaked || 0);
  readonly totalWon = computed(() => this.walletService.balance().totalWon || 0);
  readonly hasMore = computed(() => this.transactions().length < this.totalTransactions());

  readonly depositTransactions = computed(() => this.transactions().filter(t => t.type === 'deposit'));
  readonly withdrawalTransactions = computed(() => this.transactions().filter(t => t.type === 'withdrawal'));

  init() {
    this.fetchBalance();
    this.fetchBanks();
    this.fetchTransactions();
    this.recoverPendingDeposits();
    this.fetchWithdrawalLimits();
    this._stake.fetchActiveStakes();
  }

  recoverPendingDeposits() {
    this.walletService.recoverPendingDeposits();
  }

  fetchBalance() {
    this.walletService.fetchBalance();
  }

  fetchBanks() {
    this.walletService.fetchBanks();
  }

  fetchWithdrawalLimits() {
    this.walletService.fetchWithdrawalLimits();
  }

  fetchTransactions(page = 1) {
    if (page === 1) {
      this.loading.set(true);
      this.transactions.set([]);
    } else {
      this.loadingMore.set(true);
    }
    this.walletService.fetchTransactions(page, 20).subscribe({
      next: (res) => {
        if (res.success) {
          if (page === 1) {
            this.transactions.set(res.data.transactions);
          } else {
            this.transactions.update(t => [...t, ...res.data.transactions]);
          }
          this.totalTransactions.set(res.data.total);
          this.currentPage.set(page);
        }
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => { this.loading.set(false); this.loadingMore.set(false); }
    });
  }

  onPageChange(pageIndex: number) {
    this.fetchTransactions(pageIndex + 1);
  }

  loadMore() {
    if (!this.hasMore() || this.loadingMore()) return;
    this.fetchTransactions(this.currentPage() + 1);
  }

  openDeposit(displayTopUp: ReturnType<typeof signal<boolean>>) {
    displayTopUp.set(true);
  }

  openWithdraw() {
    this._router.navigate(['/wallet/withdraw']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount || 0);
  }

  formatDay(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  }

  formatType(type: string): string {
    if (type === 'deposit') return 'Deposit';
    if (type === 'withdrawal') return 'Withdrawal';
    if (type === 'stake') return 'Stake';
    if (type === 'winnings') return 'Winnings';
    if (type === 'refund') return 'Refund';
    if (type === 'cashout') return 'Cashout';
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      deposit: 'primary', withdrawal: 'warn', stake: 'accent', payout: 'primary',
      refund: 'primary', bonus: 'accent', fee: 'warn', winnings: 'primary',
      cashout: 'primary'
    };
    return colors[type] || 'primary';
  }

  isCredit(type: string): boolean {
    return ['deposit', 'payout', 'refund', 'bonus', 'winnings', 'cashout'].includes(type);
  }

  isDebit(type: string): boolean {
    return ['withdrawal', 'stake', 'fee'].includes(type);
  }

  getTransactionIcon(type: string): string {
    const icons: Record<string, string> = {
      deposit: 'account_balance_wallet', withdrawal: 'money_off', stake: 'casino',
      payout: 'emoji_events', refund: 'undo', bonus: 'card_giftcard', fee: 'receipt_long',
      winnings: 'emoji_events', cashout: 'currency_exchange'
    };
    return icons[type] || 'help';
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'chip-accent', processing: 'chip-primary', completed: 'chip-emerald',
      failed: 'chip-warn', cancelled: 'chip-warn', reversed: 'chip-accent'
    };
    return classes[status] || 'chip-warn';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: 'schedule', processing: 'autorenew', completed: 'check_circle',
      failed: 'error', cancelled: 'cancel', reversed: 'undo'
    };
    return icons[status] || 'help';
  }

  formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
