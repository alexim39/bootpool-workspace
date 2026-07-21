import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WalletService, WalletBalance, Transaction, Bank, WithdrawalLimits, AccountResolution } from '../../core/services/wallet.service';
import { AuthService } from '../../core/services/auth.service';
import { StakeService } from '../../core/services/stake.service';
import { AppNavComponent } from '../../core/components/app-nav/app-nav.component';
import { TopUpModalComponent } from '../../core/components/top-up-modal/top-up-modal.component';

@Component({
  selector: 'app-wallet-desktop',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatBadgeModule,
    MatChipsModule,
    MatTooltipModule,
    AppNavComponent,
    TopUpModalComponent
  ],
  templateUrl: './wallet-desktop.component.html',
  styleUrls: ['./wallet-desktop.component.scss']
})
export class WalletDesktopComponent implements OnInit {
  private _wallet = inject(WalletService);
  _auth = inject(AuthService);
  private _stake = inject(StakeService);
  private _router = inject(Router);
  private _snackBar = inject(MatSnackBar);

  displayTopUp = signal(false);

  displayedColumns = ['date', 'type', 'description', 'amount', 'status'];
  transactions = signal<any[]>([]);
  banks = signal<Bank[]>([]);
  withdrawalLimits = signal<WithdrawalLimits>({ min: 500, max: 5000000, dailyLimit: 10000000, fee: '1.5% (max ₦50)' });
  loading = signal(false);
  loadingMore = signal(false);
  totalTransactions = signal(0);
  currentPage = signal(1);
  hasMore = computed(() => this.transactions().length < this.totalTransactions());

  walletBalance = computed(() => this._wallet.balance());
  totalDeposited = computed(() => this._wallet.balance().totalDeposited || 0);
  totalWithdrawn = computed(() => this._wallet.balance().totalWithdrawn || 0);
  totalStaked = computed(() => this._wallet.balance().totalStaked || 0);
  totalWon = computed(() => this._wallet.balance().totalWon || 0);

  depositTransactions = computed(() => this.transactions().filter(t => t.type === 'deposit'));
  withdrawalTransactions = computed(() => this.transactions().filter(t => t.type === 'withdrawal'));

  ngOnInit() {
    this.recoverPendingDeposits();
    this.fetchBalance();
    this.fetchBanks();
    this.fetchTransactions();
    this.fetchWithdrawalLimits();
    this._stake.fetchActiveStakes();
  }

  recoverPendingDeposits() {
    this._wallet.recoverPendingDeposits().subscribe({
      next: (res) => {
        if (res.success && res.data.recovered > 0) {
          this.fetchBalance();
          this.fetchTransactions();
        }
      }
    });
  }

  fetchBalance() { this._wallet.fetchBalance(); }
  fetchBanks() { this._wallet.fetchBanks(); }

  fetchTransactions(page = 1) {
    if (page === 1) { this.loading.set(true); this.transactions.set([]); }
    else this.loadingMore.set(true);
    this._wallet.fetchTransactions(page, 20).subscribe({
      next: (res) => {
        if (res.success) {
          this.transactions.set(res.data.transactions);
          this.totalTransactions.set(res.data.total);
          this.currentPage.set(page);
        }
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => { this.loading.set(false); this.loadingMore.set(false); }
    });
  }

  fetchWithdrawalLimits() { this._wallet.fetchWithdrawalLimits(); }

  onPageChange(event: PageEvent) { this.fetchTransactions(event.pageIndex + 1); }

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
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      deposit: 'primary', withdrawal: 'warn', stake: 'accent', payout: 'primary', refund: 'primary', bonus: 'accent', fee: 'warn'
    };
    return colors[type] || 'primary';
  }

  isCredit(type: string): boolean { return ['deposit', 'payout', 'refund', 'bonus'].includes(type); }
  isDebit(type: string): boolean { return ['withdrawal', 'stake', 'fee'].includes(type); }

  getTransactionIcon(type: string): string {
    const icons: Record<string, string> = {
      deposit: 'account_balance_wallet', withdrawal: 'money_off', stake: 'casino',
      payout: 'emoji_events', refund: 'undo', bonus: 'card_giftcard', fee: 'receipt_long'
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

  formatStatus(status: string): string { return status.charAt(0).toUpperCase() + status.slice(1); }

  openDeposit() { this.displayTopUp.set(true); }
  openWithdrawDialog() { this._router.navigate(['/wallet/withdraw']); }
}
