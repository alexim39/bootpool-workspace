import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { StakeService, Stake } from '../../../core/services/stake.service';
import { WalletService } from '../../../core/services/wallet.service';
import { AuthService } from '../../../core/services/auth.service';
import { CashoutModalComponent } from '../../home/cashout-modal.component';
import { MobileNavComponent } from '../../../core/components/mobile-nav/mobile-nav.component';

@Component({
  selector: 'app-bets-mobile',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatChipsModule, CashoutModalComponent, MobileNavComponent
  ],
  template: `
    <div class="mobile-bets">
      <header class="mobile-header">
        <button mat-icon-button routerLink="/home"><mat-icon>arrow_back</mat-icon></button>
        <h1>My Bets</h1>
        <button mat-icon-button (click)="_auth.logout()"><mat-icon>logout</mat-icon></button>
      </header>

      <div class="stats-row">
        <div class="stat-pill s-active">
          <span class="stat-num">{{ activeCount() }}</span>
          <span class="stat-lbl">Active</span>
        </div>
        <div class="stat-pill s-won">
          <span class="stat-num">{{ wonCount() }}</span>
          <span class="stat-lbl">Won</span>
        </div>
        <div class="stat-pill s-refunded">
          <span class="stat-num">{{ refundedCount() }}</span>
          <span class="stat-lbl">Refunded</span>
        </div>
        <div class="stat-pill s-void">
          <span class="stat-num">{{ voidCount() }}</span>
          <span class="stat-lbl">Void</span>
        </div>
      </div>

      <div class="tab-bar">
        <button class="tab-btn" [class.active]="activeTab() === 'active'" (click)="activeTab.set('active')">
          <mat-icon>schedule</mat-icon> Active
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'history'" (click)="activeTab.set('history')">
          <mat-icon>history</mat-icon> History
        </button>
      </div>

      @if (activeTab() === 'active') {
        <div class="list-content">
          @if (loading()) {
            <div class="loading-center"><mat-spinner diameter="24"></mat-spinner></div>
          } @else if (activeStakes().length === 0) {
            <div class="empty-state">
              <mat-icon>sports_esports</mat-icon>
              <p>No active bets</p>
              <button class="btn-emerald" routerLink="/home">
                <mat-icon>casino</mat-icon> Browse Odds
              </button>
            </div>
          } @else {
            @for (stake of activeStakes(); track stake.id) {
              <div class="bet-card-mobile">
                <div class="bet-card-header">
                  <span class="bet-status" [class]="stake.status">{{ formatStatus(stake.status) }}</span>
                  <span class="bet-date">{{ formatDay(stake.createdAt) }}</span>
                </div>
                <div class="bet-teams">
                  <span>{{ stake.pod.homeTeam }}</span>
                  <mat-icon>sports_soccer</mat-icon>
                  <span>{{ stake.pod.awayTeam }}</span>
                </div>
                <div class="bet-meta">
                  <span class="bet-market" *ngIf="stake.pod.marketType">{{ stake.pod.marketType }}</span>
                  <span class="bet-refund" *ngIf="stake.pod.refundPercent">{{ stake.pod.refundPercent }}% cash back</span>
                </div>
                <div class="bet-pick">
                  @if (stake.isSettled) {
                    <span class="pick-label">Pick:</span>
                    <span class="pick-value">{{ stake.pod.selection }}</span>
                  }
                  @if (stake.isParlay && stake.combinedMultiplier) {
                    <span class="pick-odds">{{ stake.combinedMultiplier.toFixed(2) }}x</span>
                  } @else {
                    <span class="pick-odds">{{ stake.pod.gainsMultiplier.toFixed(2) }}x</span>
                  }
                </div>
                @if (stake.isParlay && stake.items) {
                  <div class="parlay-legs">
                    @for (item of stake.items; track item.pod) {
                      <div class="parlay-leg">
                        <span class="leg-teams">{{ item.homeTeam }} vs {{ item.awayTeam }}</span>
                        <span class="leg-detail">{{ item.selection }} &#64; {{ item.gainsMultiplier.toFixed(2) }}x</span>
                        <span class="leg-status" [class.won]="item.status === 'won'" [class.lost]="item.status === 'lost'" [class.void]="item.status === 'void'">
                          {{ item.status }}
                        </span>
                      </div>
                    }
                  </div>
                }
                <div class="bet-card-footer">
                  <div class="bet-amounts">
                    <span>Stake: <strong>{{ formatCurrency(stake.stakeAmount) }}</strong></span>
                    <span>Payout: <strong class="emerald">{{ formatCurrency(stake.netPayout) }}</strong></span>
                  </div>
                  @if (!stake.isSettled && !stake.isParlay) {
                    <button class="btn-cashout" (click)="requestCashout(stake.id)">
                      <mat-icon>autorenew</mat-icon>
                    </button>
                  }
                </div>
                @if (stake.isSettled) {
                  <div class="bet-result">
                    @if (stake.status === 'won') {
                      <span>Won</span>
                      <span class="positive">+{{ formatCurrency(stake.profit!) }}</span>
                    } @else if (stake.status === 'cashed_out') {
                      <span>Cashed Out</span>
                      <span class="neutral">{{ formatCurrency(stake.profit!) }}</span>
                    } @else {
                      <span>Refunded</span>
                      <span class="neutral">{{ formatCurrency(stake.stakeAmount) }}</span>
                    }
                  </div>
                }
              </div>
            }
          }
        </div>
      }

      @if (activeTab() === 'history') {
        <div class="list-content">
          @if (loadingHistory()) {
            <div class="loading-center"><mat-spinner diameter="24"></mat-spinner></div>
          } @else if (settledStakes().length === 0) {
            <div class="empty-state">
              <mat-icon>history</mat-icon>
              <p>No settled bets yet</p>
            </div>
          } @else {
            @for (stake of settledStakes(); track stake.id) {
              <div class="bet-card-mobile settled">
                <div class="bet-card-header">
                  <span class="bet-status" [class]="stake.status">{{ formatStatus(stake.status) }}</span>
                  <span class="bet-date">{{ formatDay(stake.createdAt) }}</span>
                </div>
                <div class="bet-teams">
                  <span>{{ stake.pod.homeTeam }}</span>
                  <mat-icon>sports_soccer</mat-icon>
                  <span>{{ stake.pod.awayTeam }}</span>
                </div>
                <div class="bet-meta">
                  <span class="bet-market" *ngIf="stake.pod.marketType">{{ stake.pod.marketType }}</span>
                  <span class="bet-refund" *ngIf="stake.pod.refundPercent">{{ stake.pod.refundPercent }}% cash back</span>
                </div>
                <div class="bet-pick">
                  @if (stake.isSettled) {
                    <span class="pick-label">Pick:</span>
                    <span class="pick-value">{{ stake.pod.selection }}</span>
                  }
                  @if (stake.isParlay && stake.combinedMultiplier) {
                    <span class="pick-odds">{{ stake.combinedMultiplier.toFixed(2) }}x</span>
                  } @else {
                    <span class="pick-odds">{{ stake.pod.gainsMultiplier.toFixed(2) }}x</span>
                  }
                </div>
                @if (stake.isParlay && stake.items) {
                  <div class="parlay-legs">
                    @for (item of stake.items; track item.pod) {
                      <div class="parlay-leg">
                        <span class="leg-teams">{{ item.homeTeam }} vs {{ item.awayTeam }}</span>
                        <span class="leg-detail">{{ item.selection }} &#64; {{ item.gainsMultiplier.toFixed(2) }}x</span>
                        <span class="leg-status" [class.won]="item.status === 'won'" [class.lost]="item.status === 'lost'" [class.void]="item.status === 'void'">
                          {{ item.status }}
                        </span>
                      </div>
                    }
                  </div>
                }
                <div class="bet-card-footer">
                  <div class="bet-amounts">
                    <span>Stake: <strong>{{ formatCurrency(stake.stakeAmount) }}</strong></span>
                    <span>Payout: <strong class="emerald">{{ formatCurrency(stake.netPayout) }}</strong></span>
                  </div>
                </div>
                <div class="bet-result">
                  @if (stake.status === 'won') {
                    <span>Won</span>
                    <span class="positive">+{{ formatCurrency(stake.profit!) }}</span>
                  } @else if (stake.status === 'cashed_out') {
                    <span>Cashed Out</span>
                    <span class="neutral">{{ formatCurrency(stake.profit!) }}</span>
                  } @else {
                    <span>Refunded</span>
                    <span class="neutral">{{ formatCurrency(stake.stakeAmount) }}</span>
                  }
                </div>
              </div>
            }
          }
        </div>
      }

      <div class="bottom-spacer"></div>

      @if (cashingOutStake()) {
        <app-cashout-modal
          [stake]="cashingOutStake()!"
          (close)="cashingOutStake.set(null)"
          (cashoutConfirmed)="onCashoutComplete()">
        </app-cashout-modal>
      }

      <app-mobile-nav />
    </div>
  `,
  styles: [`
    .mobile-bets { background: #0A1428; min-height: 100vh; color: #FFFFFF; padding-bottom: 80px; }
    .mobile-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #0D1A30; border-bottom: 1px solid rgba(255,255,255,0.06); position: sticky; top: 0; z-index: 10; }
    .mobile-header h1 { flex: 1; margin: 0; font-size: 20px; font-weight: 700; }
    .mobile-header button { color: rgba(255,255,255,0.7); }
    .stats-row { display: flex; gap: 8px; padding: 12px 16px; }
    .stat-pill { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 10px 4px; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; }
    .s-active .stat-num { color: #00E676; }
    .s-won .stat-num { color: #00E676; }
    .s-refunded .stat-num { color: rgba(255,255,255,0.5); }
    .s-void .stat-num { color: #E8B923; }
    .stat-num { font-size: 20px; font-weight: 700; }
    .stat-lbl { font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.3px; margin-top: 2px; }
    .tab-bar { display: flex; margin: 0 16px 12px; background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); overflow: hidden; }
    .tab-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px; background: transparent; border: none; color: rgba(255,255,255,0.5); font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .tab-btn.active { background: rgba(0,230,118,0.1); color: #00E676; }
    .tab-btn mat-icon { font-size: 18px; }
    .list-content { padding: 0 16px; display: flex; flex-direction: column; gap: 10px; }
    .bet-card-mobile { background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 14px; }
    .bet-card-mobile.settled { opacity: 0.7; }
    .bet-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .bet-status { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 8px; border-radius: 4px; }
    .bet-status.won { background: rgba(0,230,118,0.15); color: #00E676; }
    .bet-status.lost, .bet-status.refunded, .bet-status.void, .bet-status.cancelled { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }
    .bet-status.pending, .bet-status.confirmed { background: rgba(232,185,35,0.15); color: #E8B923; }
    .bet-status.cashed_out { background: rgba(100,181,246,0.15); color: #64B5F6; }
    .bet-date { font-size: 12px; color: rgba(255,255,255,0.4); }
    .bet-teams { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; margin-bottom: 6px; }
    .bet-teams mat-icon { font-size: 14px; width: 14px; height: 14px; color: rgba(255,255,255,0.3); }
    .bet-meta { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; flex-wrap: wrap; }
    .bet-market { font-size: 11px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); padding: 1px 6px; border-radius: 4px; font-weight: 500; }
    .bet-refund { font-size: 11px; background: rgba(232,185,35,0.12); color: #E8B923; padding: 1px 6px; border-radius: 4px; font-weight: 600; }
    .bet-pick { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); margin-bottom: 8px; }
    .pick-label { font-size: 12px; color: rgba(255,255,255,0.4); text-transform: uppercase; }
    .pick-value { flex: 1; font-weight: 500; color: #00E676; font-size: 14px; }
    .pick-odds { font-weight: 700; color: #E8B923; font-size: 15px; }
    .bet-card-footer { display: flex; justify-content: space-between; align-items: center; }
    .bet-amounts { display: flex; flex-direction: column; gap: 2px; font-size: 14px; color: rgba(255,255,255,0.7); }
    .bet-amounts strong { color: #FFFFFF; }
    .bet-amounts .emerald { color: #00E676; }
    .btn-cashout { width: 44px; height: 44px; border-radius: 50%; background: rgba(0,230,118,0.15); border: none; color: #00E676; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .btn-cashout mat-icon { font-size: 22px; }
    .parlay-legs { display: flex; flex-direction: column; gap: 4px; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.04); margin-bottom: 8px; }
    .parlay-leg { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 3px 6px; background: rgba(255,255,255,0.03); border-radius: 4px; }
    .leg-teams { flex: 1; color: rgba(255,255,255,0.7); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .leg-detail { color: rgba(255,255,255,0.4); font-size: 11px; white-space: nowrap; }
    .leg-status { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 1px 5px; border-radius: 3px; }
    .leg-status.won { background: rgba(0,230,118,0.15); color: #00E676; }
    .leg-status.lost { background: rgba(244,67,54,0.15); color: #f44336; }
    .leg-status.void { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); }
    .bet-result { display: flex; justify-content: space-between; padding-top: 8px; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.04); font-size: 14px; }
    .positive { color: #00E676; font-weight: 700; }
    .negative { color: rgba(255,255,255,0.5); font-weight: 700; }
    .neutral { color: rgba(255,255,255,0.5); font-weight: 700; }
    .loading-center { display: flex; justify-content: center; padding: 32px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 32px 16px; text-align: center; color: rgba(255,255,255,0.5); }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 8px; opacity: 0.5; }
    .empty-state p { margin: 0 0 16px; font-size: 14px; }
    .bottom-spacer { height: 80px; }
    .btn-emerald { background: linear-gradient(135deg, #00E676, #00C853); color: #0A1428; border: none; border-radius: 12px; padding: 12px 24px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
    ::ng-deep .mat-mdc-snack-bar-container { --mdc-snackbar-supporting-text-color: #FFFFFF; --mdc-snackbar-container-color: #0D1A30; }
  `]
})
export class BetsMobileComponent implements OnInit {
  private stakeService = inject(StakeService);
  private walletService = inject(WalletService);
  _auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  loadingHistory = signal(false);
  activeTab = signal<'active' | 'history'>('active');
  totalStakes = signal(0);

  cashingOutStake = signal<Stake | null>(null);

  activeStakes = computed(() => this.stakeService.activeStakes());
  activeCount = computed(() => this.activeStakes().length);
  wonCount = signal(0);
  refundedCount = signal(0);
  voidCount = signal(0);
  settledStakes = signal<Stake[]>([]);

  constructor() {
    effect(() => { this.loadCounts(); });
  }

  ngOnInit() {
    this.stakeService.fetchActiveStakes();
    this.fetchSettledStakes();
    this.walletService.fetchBalance();
  }

  loadCounts() {
    const settled = this.settledStakes();
    this.wonCount.set(settled.filter(s => s.status === 'won').length);
    this.refundedCount.set(settled.filter(s => ['lost', 'refunded', 'cancelled'].includes(s.status)).length);
    this.voidCount.set(settled.filter(s => s.status === 'void').length);
  }

  fetchSettledStakes(page = 1) {
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
    if (stake && !stake.isParlay) this.cashingOutStake.set(stake);
  }

  onCashoutComplete() {
    this.cashingOutStake.set(null);
    this.stakeService.fetchActiveStakes();
    this.fetchSettledStakes();
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

  formatStatus(status: Stake['status']): string {
    if (status === 'cashed_out') return 'Cashed Out';
    if (status === 'lost') return 'Refunded';
    if (status === 'confirmed') return 'Active';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
