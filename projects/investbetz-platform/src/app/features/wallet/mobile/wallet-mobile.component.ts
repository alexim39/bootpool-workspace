import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { WalletService, Bank } from '../../../core/services/wallet.service';
import { AuthService } from '../../../core/services/auth.service';
import { TopUpModalComponent } from '../../../core/components/top-up-modal/top-up-modal.component';
import { MobileNavComponent } from '../../../core/components/mobile-nav/mobile-nav.component';

@Component({
  selector: 'app-wallet-mobile',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatBadgeModule,
    TopUpModalComponent, MobileNavComponent
  ],
  template: `
    <div class="mobile-wallet">
      <header class="mobile-header">
        <button mat-icon-button routerLink="/home"><mat-icon>arrow_back</mat-icon></button>
        <h1>Wallet</h1>
        <button mat-icon-button (click)="_auth.logout()"><mat-icon>logout</mat-icon></button>
      </header>

      <div class="balance-card">
        <div class="balance-label">Available Balance</div>
        <div class="balance-amount">{{ formatCurrency(walletBalance().available) }}</div>
        <div class="balance-sub">
          <span>Total Balance: {{ formatCurrency(walletBalance().balance) }}</span>
          <span *ngIf="walletBalance().locked > 0" class="locked">Locked (Active Stakes): {{ formatCurrency(walletBalance().locked) }}</span>
        </div>
        <div class="balance-actions">
          <button class="btn-action btn-deposit" (click)="showTopUp.set(true)">
            <mat-icon>add</mat-icon> Deposit
          </button>
          <button class="btn-action btn-withdraw" (click)="openWithdraw()">
            <mat-icon>remove</mat-icon> Withdraw
          </button>
        </div>
      </div>

      <div class="section-header"><span>Quick Stats</span></div>
      <div class="stats-grid">
        <div class="stat-item">
          <mat-icon class="stat-icon s-primary">trending_up</mat-icon>
          <span class="stat-val">{{ formatCurrency(totalDeposited()) }}</span>
          <span class="stat-lbl">Deposited</span>
        </div>
        <div class="stat-item">
          <mat-icon class="stat-icon s-gold">trending_down</mat-icon>
          <span class="stat-val">{{ formatCurrency(totalWithdrawn()) }}</span>
          <span class="stat-lbl">Withdrawn</span>
        </div>
        <div class="stat-item">
          <mat-icon class="stat-icon s-primary">casino</mat-icon>
          <span class="stat-val">{{ formatCurrency(totalStaked()) }}</span>
          <span class="stat-lbl">Staked</span>
        </div>
        <div class="stat-item">
          <mat-icon class="stat-icon s-primary">emoji_events</mat-icon>
          <span class="stat-val">{{ formatCurrency(totalWon()) }}</span>
          <span class="stat-lbl">Won</span>
        </div>
      </div>

      <div class="section-header"><span>Transaction History <span class="txn-count">({{ totalTransactions() }})</span></span></div>
      <div class="filter-row">
        <button class="filter-chip" [class.active]="activeFilter() === 'all'" (click)="activeFilter.set('all')">All</button>
        <button class="filter-chip" [class.active]="activeFilter() === 'deposit'" (click)="activeFilter.set('deposit')">Deposits</button>
        <button class="filter-chip" [class.active]="activeFilter() === 'withdrawal'" (click)="activeFilter.set('withdrawal')">Withdrawals</button>
      </div>
      <div class="txn-list">
        @if (loading()) {
          <div class="loading-center"><mat-spinner diameter="24"></mat-spinner></div>
        } @else {
          @for (txn of filteredTransactions(); track txn.id) {
            <div class="txn-item">
              <div class="txn-left">
                <div class="txn-icon" [class]="'icon-' + getTypeColor(txn.type)">
                  <mat-icon>{{ getTransactionIcon(txn.type) }}</mat-icon>
                </div>
                <div class="txn-info">
                  <span class="txn-type">{{ formatType(txn.type) }}</span>
                  <span class="txn-date">{{ formatDay(txn.createdAt) }}</span>
                </div>
              </div>
              <div class="txn-right">
                <span class="txn-amount" [class.credit]="isCredit(txn.type)" [class.debit]="isDebit(txn.type)">
                  {{ isCredit(txn.type) ? '+' : '-' }}{{ formatCurrency(txn.amount) }}
                </span>
                <span class="txn-status" [class]="txn.status">{{ formatStatus(txn.status) }}</span>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              @if (activeFilter() === 'all') {
                <mat-icon>receipt_long</mat-icon>
                <p>No transactions yet</p>
                <button class="btn-emerald" routerLink="/home">Browse Odds</button>
              } @else if (activeFilter() === 'deposit') {
                <mat-icon>account_balance_wallet</mat-icon>
                <p>No deposits yet</p>
              } @else {
                <mat-icon>money_off</mat-icon>
                <p>No withdrawals yet</p>
              }
            </div>
          }
          @if (hasMore()) {
            <div class="load-more-container">
              @if (loadingMore()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <button class="load-more-btn" (click)="loadMore()">
                  <mat-icon>expand_more</mat-icon> Load More
                </button>
              }
            </div>
          }
        }
      </div>

      <app-top-up-modal [visible]="showTopUp()" [disableClose]="true" (close)="showTopUp.set(false)" />
      <app-mobile-nav />
    </div>
  `,
  styles: [`
    .mobile-wallet { background: #0A1428; min-height: 100vh; color: #FFFFFF; padding-bottom: 80px; }
    .mobile-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #0D1A30; border-bottom: 1px solid rgba(255,255,255,0.06); position: sticky; top: 0; z-index: 10; }
    .mobile-header h1 { flex: 1; margin: 0; font-size: 20px; font-weight: 700; }
    .mobile-header button { color: rgba(255,255,255,0.7); }
    .balance-card { margin: 12px 16px; padding: 20px; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; }
    .balance-label { font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 4px; }
    .balance-amount { font-size: 36px; font-weight: 700; margin: 4px 0 12px; }
    .balance-sub { display: flex; gap: 16px; font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .balance-sub .locked { color: #E8B923; }
    .balance-actions { display: flex; gap: 12px; }
    .btn-action { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; height: 48px; border-radius: 12px; font-size: 15px; font-weight: 600; border: none; cursor: pointer; }
    .btn-deposit { background: linear-gradient(135deg, #00E676, #00C853); color: #0A1428; }
    .btn-withdraw { background: transparent; color: #E8B923; border: 2px solid #E8B923; }
    .btn-action mat-icon { font-size: 20px; }
    .section-header { padding: 16px 16px 8px; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.5px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 0 16px; }
    .stat-item { display: flex; flex-direction: column; align-items: center; padding: 12px 4px; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; }
    .stat-icon { font-size: 20px; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; }
    .s-primary { background: rgba(0,230,118,0.15); color: #00E676; }
    .s-gold { background: rgba(232,185,35,0.15); color: #E8B923; }
    .stat-val { font-size: 14px; font-weight: 700; color: #FFFFFF; }
    .stat-lbl { font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; margin-top: 2px; }
    .txn-list { margin: 0 16px; display: flex; flex-direction: column; gap: 8px; }
    .txn-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; min-height: 56px; }
    .txn-left { display: flex; align-items: center; gap: 12px; }
    .txn-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
    .icon-primary { background: rgba(0,230,118,0.15); color: #00E676; }
    .icon-warn { background: rgba(244,67,54,0.15); color: #f44336; }
    .icon-accent { background: rgba(232,185,35,0.15); color: #E8B923; }
    .txn-info { display: flex; flex-direction: column; }
    .txn-type { font-weight: 500; font-size: 14px; }
    .txn-date { font-size: 12px; color: rgba(255,255,255,0.5); }
    .txn-right { text-align: right; display: flex; flex-direction: column; gap: 2px; }
    .txn-amount { font-weight: 700; font-size: 15px; }
    .txn-amount.credit { color: #00E676; }
    .txn-amount.debit { color: #f44336; }
    .txn-status { font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
    .txn-status.completed { color: #00E676; }
    .txn-status.pending, .txn-status.processing { color: #E8B923; }
    .txn-status.failed, .txn-status.cancelled { color: #f44336; }
    .txn-count { font-weight: 400; font-size: 12px; color: rgba(255,255,255,0.4); }
    .filter-row { display: flex; gap: 8px; margin: 8px 16px 12px; }
    .filter-chip { padding: 6px 16px; background: #162245; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; color: rgba(255,255,255,0.6); font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .filter-chip.active { background: rgba(0,230,118,0.15); border-color: #00E676; color: #00E676; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 32px 16px; color: rgba(255,255,255,0.5); text-align: center; }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 8px; opacity: 0.5; }
    .empty-state p { margin: 0 0 16px; font-size: 14px; }
    .loading-center { display: flex; justify-content: center; padding: 24px; }
    .load-more-container { display: flex; justify-content: center; padding: 12px; }
    .load-more-btn { display: flex; align-items: center; gap: 6px; padding: 10px 24px; background: #162245; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .load-more-btn:hover { background: #1e2d50; color: #FFFFFF; }
    .load-more-container mat-spinner { width: 20px !important; height: 20px !important; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: flex-end; z-index: 1000; }
    .modal-sheet { width: 100%; max-height: 85vh; overflow-y: auto; background: #0D1A30; border-radius: 20px 20px 0 0; padding: 0 0 24px; animation: slideUp 0.3s ease; }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .modal-handle { width: 40px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; margin: 8px auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px 16px; }
    .modal-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: #FFFFFF; }
    .modal-header button { color: rgba(255,255,255,0.7); }
    .modal-form { padding: 0 16px; display: flex; flex-direction: column; gap: 14px; }
    .quick-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip-quick { padding: 8px 16px; background: #162245; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; color: #FFFFFF; font-size: 14px; font-weight: 500; cursor: pointer; }
    .account-verified { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: rgba(0,230,118,0.1); border: 1px solid rgba(0,230,118,0.3); border-radius: 8px; color: #00E676; font-size: 14px; font-weight: 500; }
    .account-verified mat-icon { font-size: 18px; }
    .account-error { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: rgba(244,67,54,0.1); border: 1px solid rgba(244,67,54,0.3); border-radius: 8px; color: #f44336; font-size: 14px; }
    .fee-note { font-size: 12px; color: rgba(255,255,255,0.5); text-align: center; }
    .btn-emerald { background: linear-gradient(135deg, #00E676, #00C853); color: #0A1428; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; }
    .btn-lg { height: 50px; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .full-width { width: 100%; }
    ::ng-deep .mat-mdc-form-field-outline { background: #162245 !important; border-radius: 8px; }
    ::ng-deep .mat-mdc-text-field-wrapper { background: #162245 !important; border-radius: 8px !important; height: 50px !important; }
    ::ng-deep .mat-mdc-form-field-flex { margin-top: 0 !important; }
    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__leading,
    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__notch,
    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__trailing { border-color: rgba(255,255,255,0.1) !important; }
    ::ng-deep .mat-mdc-input-element { color: #FFFFFF !important; caret-color: #00E676; font-size: 16px !important; }
    ::ng-deep .mat-mdc-select-value-text { color: #FFFFFF !important; }
    ::ng-deep .mat-mdc-select-arrow { color: rgba(255,255,255,0.5) !important; }
    ::ng-deep .mdc-floating-label { color: rgba(255,255,255,0.5) !important; }
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    ::ng-deep .mat-mdc-snack-bar-container { --mdc-snackbar-supporting-text-color: #FFFFFF; --mdc-snackbar-container-color: #0D1A30; }
  `]
})
export class WalletMobileComponent implements OnInit {
  private _wallet = inject(WalletService);
  _auth = inject(AuthService);
  private _router = inject(Router);
  private _snackBar = inject(MatSnackBar);

  transactions = signal<any[]>([]);
  banks = signal<Bank[]>([]);
  showTopUp = signal(false);
  loading = signal(false);
  loadingMore = signal(false);
  totalTransactions = signal(0);
  currentPage = signal(1);
  hasMore = computed(() => this.transactions().length < this.totalTransactions());
  activeFilter = signal<'all' | 'deposit' | 'withdrawal'>('all');
  filteredTransactions = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.transactions();
    return this.transactions().filter(t => t.type === filter);
  });

  walletBalance = computed(() => this._wallet.balance());
  totalDeposited = computed(() => this._wallet.balance().totalDeposited || 0);
  totalWithdrawn = computed(() => this._wallet.balance().totalWithdrawn || 0);
  totalStaked = computed(() => this._wallet.balance().totalStaked || 0);
  totalWon = computed(() => this._wallet.balance().totalWon || 0);

  ngOnInit() {
    this.recoverPendingDeposits();
    this.fetchBalance();
    this.fetchBanks();
    this.fetchTransactions();
  }

  openWithdraw() { this._router.navigate(['/wallet/withdraw']); }

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
    if (page === 1) this.loading.set(true);
    else this.loadingMore.set(true);
    this._wallet.fetchTransactions(page, 20).subscribe({
      next: (res) => {
        if (res.success) {
          if (page === 1) this.transactions.set(res.data.transactions);
          else this.transactions.update(t => [...t, ...res.data.transactions]);
          this.totalTransactions.set(res.data.total);
          this.currentPage.set(page);
        }
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => { this.loading.set(false); this.loadingMore.set(false); }
    });
  }

  loadMore() {
    if (this.loadingMore() || !this.hasMore()) return;
    this.fetchTransactions(this.currentPage() + 1);
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

  formatStatus(status: string): string { return status.charAt(0).toUpperCase() + status.slice(1); }
}
