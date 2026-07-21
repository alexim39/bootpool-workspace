import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StakeService, Stake } from '../../core/services/stake.service';
import { WalletService } from '../../core/services/wallet.service';
import { AuthService } from '../../core/services/auth.service';
import { BetCardComponent } from './bet-card.component';
import { CashoutModalComponent } from '../home/cashout-modal.component';
import { AppNavComponent } from '../../core/components/app-nav/app-nav.component';

@Component({
  selector: 'app-bets-desktop',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTabsModule, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule,
    MatBadgeModule, MatChipsModule, MatTooltipModule, MatSnackBarModule, BetCardComponent, CashoutModalComponent, AppNavComponent
  ],
    template: `
    <app-nav />
    <div class="bets-container">
      <div class="page-header"><h1>My Bets</h1></div>
      <div class="bets-body">

      <div class="summary-cards">
        <mat-card class="summary-card s-active">
          <mat-card-content>
            <div class="summary-icon active"><mat-icon>schedule</mat-icon></div>
            <div class="summary-value">{{ activeCount() }}</div>
            <div class="summary-label">Active</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="summary-card s-won">
          <mat-card-content>
            <div class="summary-icon won"><mat-icon>emoji_events</mat-icon></div>
            <div class="summary-value">{{ wonCount() }}</div>
            <div class="summary-label">Won</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="summary-card s-refunded">
          <mat-card-content>
            <div class="summary-icon refunded"><mat-icon>autorenew</mat-icon></div>
            <div class="summary-value">{{ refundedCount() }}</div>
            <div class="summary-label">Refunded</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="summary-card s-void">
          <mat-card-content>
            <div class="summary-icon void"><mat-icon>remove_circle</mat-icon></div>
            <div class="summary-value">{{ voidCount() }}</div>
            <div class="summary-label">Void</div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-tab-group class="bets-tabs">
        <mat-tab label="Active">
          <div class="tab-content">
            @if (loading()) {
              <div class="loading-center"><mat-spinner></mat-spinner></div>
            } @else if (activeStakes().length === 0) {
              <div class="empty-state">
                <mat-icon>sports_esports</mat-icon>
                <h3>No active bets</h3>
                <p>Your active stakes will appear here</p>
                <button mat-raised-button class="btn-emerald" routerLink="/home">
                  <mat-icon>casino</mat-icon> Browse Odds
                </button>
              </div>
            } @else {
              <div class="bets-list">
                @for (stake of activeStakes(); track stake.id) {
                  <app-bet-card 
                    [stake]="stake" 
                    [showActions]="true"
                    (cashoutRequested)="requestCashout($event)">
                  </app-bet-card>
                }
              </div>
            }
          </div>
        </mat-tab>

        <mat-tab label="History">
          <div class="tab-content">
            @if (loadingHistory()) {
              <div class="loading-center"><mat-spinner></mat-spinner></div>
            } @else if (settledStakes().length === 0) {
              <div class="empty-state">
                <mat-icon>history</mat-icon>
                <h3>No settled bets yet</h3>
                <p>Your bet history will appear here once stakes are settled</p>
              </div>
            } @else {
              <div class="table-container">
                <table mat-table [dataSource]="settledStakes()" class="bets-table">
                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>Date</th>
                    <td mat-cell *matCellDef="let stake">
                      <div class="stake-date">
                        <span class="stake-day">{{ formatDay(stake.createdAt) }}</span>
                        <span class="stake-time">{{ formatTime(stake.createdAt) }}</span>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="match">
                    <th mat-header-cell *matHeaderCellDef>Selection</th>
                    <td mat-cell *matCellDef="let stake">
                      <div class="stake-match">
                        @if (stake.isParlay && stake.items) {
                          <div class="parlay-summary">
                            <span class="parlay-badge">{{ stake.items.length }}-Leg Parlay</span>
                            <div class="parlay-teams">
                              @for (item of stake.items; track item.pod; let last = $last) {
                                <span>{{ item.homeTeam }} vs {{ item.awayTeam }}{{ !last ? ', ' : '' }}</span>
                              }
                            </div>
                          </div>
                        } @else {
                          <div class="match-teams">
                            <span>{{ stake.pod?.homeTeam }}</span>
                            <mat-icon>sports_soccer</mat-icon>
                            <span>{{ stake.pod?.awayTeam }}</span>
                          </div>
                          <div class="match-selection">
                            @if (stake.isSettled) {
                              <span class="selection-value">{{ stake.pod?.selection }}</span>
                            }
                          </div>
                        }
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="odds">
                    <th mat-header-cell *matHeaderCellDef>Odds</th>
                    <td mat-cell *matCellDef="let stake">
                      @if (stake.isParlay && stake.combinedMultiplier) {
                        <span class="odds-value parlay-odds">{{ stake.combinedMultiplier.toFixed(2) }}x</span>
                        <span class="parlay-legs-count">{{ stake.items?.length }} legs</span>
                      } @else {
                        <span class="odds-value">{{ stake.pod?.gainsMultiplier?.toFixed(2) }}x</span>
                      }
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="stake">
                    <th mat-header-cell *matHeaderCellDef>Stake</th>
                    <td mat-cell *matCellDef="let stake">
                      <span class="stake-amount">{{ formatCurrency(stake.stakeAmount) }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="payout">
                    <th mat-header-cell *matHeaderCellDef>Potential</th>
                    <td mat-cell *matCellDef="let stake">
                      <div class="payout-info">
                        <span class="net-payout">{{ formatCurrency(stake.netPayout) }}</span>
                        <span class="fee-info" *ngIf="stake.platformFee > 0">
                          (Fee: {{ formatCurrency(stake.platformFee) }})
                        </span>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let stake">
                      <mat-chip [class]="getStatusClass(stake.status)" selected>
                        <mat-icon matChipAvatar>{{ getStatusIcon(stake.status) }}</mat-icon>
                        {{ formatStatus(stake.status) }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="result">
                    <th mat-header-cell *matHeaderCellDef>Result</th>
                    <td mat-cell *matCellDef="let stake">
                      <div class="result-info">
                        @if (stake.status === 'won') {
                          <span class="profit positive">+{{ formatCurrency(stake.profit!) }}</span>
                        } @else if (stake.status === 'cashed_out') {
                          <span class="profit neutral">{{ formatCurrency(stake.profit!) }}</span>
                        } @else {
                          <span class="profit neutral">{{ formatCurrency(stake.stakeAmount) }}</span>
                        }
                        <span class="settled-time" *ngIf="stake.settledAt">
                          {{ formatTime(stake.settledAt) }}
                        </span>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let stake">
                      <button mat-icon-button [matTooltip]="'View details'" (click)="viewStakeDetails(stake)">
                        <mat-icon>visibility</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>

                <mat-paginator 
                  [length]="totalStakes()" 
                  [pageSize]="20" 
                  [pageSizeOptions]="[10, 20, 50]"
                  (page)="onPageChange($event)"
                  showFirstLastButtons>
                </mat-paginator>
              </div>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
      </div>
      @if (cashingOutStake()) {
        <app-cashout-modal
          [stake]="cashingOutStake()!"
          (close)="cashingOutStake.set(null)"
          (cashoutConfirmed)="onCashoutComplete()">
        </app-cashout-modal>
      }
    </div>
  `,
  styles: [`
    .bets-container { padding: 0; max-width: 900px; margin: 0 auto; background: #0A1428; min-height: 100vh; color: #FFFFFF; }
    .bets-body { padding: 0 24px 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 0 16px; }
    .page-header h1 { margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; }
    .page-header button { color: rgba(255,255,255,0.7); }
    .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .summary-card { text-align: center; padding: 16px 12px; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; color: #FFFFFF; }
    .summary-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 22px; }
    .summary-icon.active { background: rgba(0,230,118,0.15); color: #00E676; }
    .summary-icon.won { background: rgba(0,230,118,0.15); color: #00E676; }
    .summary-icon.refunded { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }
    .summary-icon.void { background: rgba(232,185,35,0.15); color: #E8B923; }
    .summary-value { font-size: 22px; font-weight: 700; margin-bottom: 2px; color: #FFFFFF; }
    .summary-label { font-size: 12px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px; }
    .bets-tabs { background: #0D1A30; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }
    ::ng-deep .bets-tabs .mat-mdc-tab-header { background: #0D1A30; }
    ::ng-deep .bets-tabs .mat-mdc-tab .mdc-tab__text-label { color: #00E676; font-size: 14px; font-weight: 600; }
    ::ng-deep .bets-tabs .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label { color: #00E676; font-weight: 700; }
    ::ng-deep .bets-tabs .mat-mdc-tab-indicator { background: #00E676; height: 3px; }
    ::ng-deep .bets-tabs .mat-mdc-tab-indicator .mdc-tab-indicator__content { border-color: #00E676; }
    .tab-content { padding: 20px; color: #FFFFFF; }
    .bets-list { display: flex; flex-direction: column; gap: 12px; }
    .table-container { overflow-x: auto; }
    .bets-table { width: 100%; }
    ::ng-deep .bets-table .mat-mdc-header-row { background: #162245; }
    ::ng-deep .bets-table .mat-mdc-header-cell { color: rgba(255,255,255,0.7); font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    ::ng-deep .bets-table .mat-mdc-cell { color: #FFFFFF; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.04); padding: 12px 8px; }
    .stake-date { display: flex; flex-direction: column; }
    .stake-day { font-weight: 500; color: #FFFFFF; }
    .stake-time { font-size: 12px; color: rgba(255,255,255,0.5); }
    .stake-match { display: flex; flex-direction: column; gap: 4px; }
    .match-teams { display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 14px; color: #FFFFFF; }
    .match-teams mat-icon { font-size: 16px; width: 16px; height: 16px; color: rgba(255,255,255,0.4); }
    .selection-value { font-size: 14px; font-weight: 500; color: #00E676; }
    .match-selection { display: flex; flex-direction: row; gap: 6px; align-items: center; flex-wrap: wrap; }
    .market-tag { font-size: 11px; color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.06); padding: 1px 6px; border-radius: 4px; font-weight: 500; }
    .refund-tag { font-size: 11px; color: #E8B923; background: rgba(232,185,35,0.12); padding: 1px 6px; border-radius: 4px; font-weight: 600; }
    .odds-value { font-weight: 600; color: #E8B923; }
    .parlay-odds { color: #CE93D8; }
    .parlay-legs-count { display: block; font-size: 10px; color: rgba(255,255,255,0.4); }
    .parlay-summary { display: flex; flex-direction: column; gap: 2px; }
    .parlay-badge { font-size: 11px; color: #CE93D8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    .parlay-teams { font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.3; }
    .stake-amount { font-weight: 600; color: #FFFFFF; }
    .payout-info { display: flex; flex-direction: column; gap: 2px; }
    .net-payout { font-weight: 600; color: #00E676; }
    .fee-info { font-size: 12px; color: rgba(255,255,255,0.5); }
    .result-info { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .profit { font-weight: 600; font-size: 14px; }
    .profit.positive { color: #00E676; }
    .profit.negative { color: rgba(255,255,255,0.5); }
    .profit.neutral { color: rgba(255,255,255,0.5); }
    .settled-time { font-size: 10px; color: rgba(255,255,255,0.4); }
    .loading-center { display: flex; justify-content: center; padding: 32px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 16px; text-align: center; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5; color: rgba(255,255,255,0.5); }
    .empty-state h3 { margin: 0 0 8px; font-size: 16px; color: #FFFFFF; }
    .empty-state p { margin: 0 0 24px; font-size: 14px; color: rgba(255,255,255,0.5); }
    ::ng-deep .btn-emerald { background: linear-gradient(135deg, #00E676, #00C853) !important; color: #0A1428 !important; border: none !important; }
    ::ng-deep .btn-emerald mat-icon { color: #0A1428 !important; font-size: 18px !important; margin: 0 -10px -30px 0 !important; }
    ::ng-deep .chip-emerald { background: rgba(0,230,118,0.15) !important; --mdc-chip-label-text-color: #00E676; }
    ::ng-deep .chip-gold { background: rgba(232,185,35,0.15) !important; --mdc-chip-label-text-color: #E8B923; }
    ::ng-deep .chip-gray { background: rgba(255,255,255,0.08) !important; --mdc-chip-label-text-color: rgba(255,255,255,0.6); }
    ::ng-deep .chip-blue { background: rgba(100,181,246,0.15) !important; --mdc-chip-label-text-color: #64B5F6; }
    ::ng-deep .mat-mdc-chip.mat-mdc-standard-chip { background: transparent; }
    ::ng-deep .mat-mdc-paginator { background: #0D1A30 !important; color: rgba(255,255,255,0.7) !important; }
    ::ng-deep .mat-mdc-paginator .mat-mdc-icon-button { color: rgba(255,255,255,0.7) !important; }
    ::ng-deep .mat-mdc-paginator .mat-mdc-select-value-text { color: rgba(255,255,255,0.7) !important; }
    ::ng-deep .mat-mdc-snack-bar-container { --mdc-snackbar-supporting-text-color: #FFFFFF; --mdc-snackbar-container-color: #0D1A30; }
  `]
})
export class BetsDesktopComponent implements OnInit {
  private stakeService = inject(StakeService);
  private walletService = inject(WalletService);
  _auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  loadingHistory = signal(false);
  currentPage = signal(1);
  totalStakes = signal(0);

  cashingOutStake = signal<Stake | null>(null);

  activeStakes = computed(() => this.stakeService.activeStakes());
  activeCount = computed(() => this.activeStakes().length);
  walletBalance = computed(() => this.walletService.balance().available || 0);
  wonCount = signal(0);
  refundedCount = signal(0);
  voidCount = signal(0);
  settledStakes = signal<Stake[]>([]);

  displayedColumns = ['date', 'match', 'odds', 'stake', 'payout', 'status', 'result', 'actions'];

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

  onPageChange(event: PageEvent) { this.fetchSettledStakes(event.pageIndex + 1); }

  requestCashout(stakeId: string) {
    const stake = this.activeStakes().find(s => s.id === stakeId);
    if (stake && !stake.isParlay) this.cashingOutStake.set(stake);
  }

  onCashoutComplete() {
    this.cashingOutStake.set(null);
    this.stakeService.fetchActiveStakes();
    this.fetchSettledStakes();
  }

  viewStakeDetails(stake: Stake) {
    this.snackBar.open('Stake details', 'OK', { duration: 2000 });
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

  getStatusClass(status: Stake['status']): string {
    const classes: Record<Stake['status'], string> = {
      pending: 'chip-gold', confirmed: 'chip-gold', won: 'chip-emerald',
      lost: 'chip-gray', void: 'chip-gray', refunded: 'chip-gray', cancelled: 'chip-gray', cashed_out: 'chip-blue'
    };
    return classes[status] || 'chip-gray';
  }

  getStatusIcon(status: Stake['status']): string {
    const icons: Record<Stake['status'], string> = {
      pending: 'schedule', confirmed: 'check_circle', won: 'emoji_events',
      lost: 'autorenew', void: 'remove_circle', refunded: 'autorenew', cancelled: 'block', cashed_out: 'currency_exchange'
    };
    return icons[status] || 'help';
  }

  formatStatus(status: Stake['status']): string {
    if (status === 'cashed_out') return 'Cashed Out';
    if (status === 'lost') return 'Refunded';
    if (status === 'confirmed') return 'Active';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
