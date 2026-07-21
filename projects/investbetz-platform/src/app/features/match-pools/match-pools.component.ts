import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { DeviceService } from '../../core/services/device.service';
import { MatchPoolService, MyPoolStake } from '../../core/services/match-pool.service';
import { AuthService } from '../../core/services/auth.service';
import { AppNavComponent } from '../../core/components/app-nav/app-nav.component';
import { MobileNavComponent } from '../../core/components/mobile-nav/mobile-nav.component';

type View = 'list' | 'my-stakes';

@Component({
  selector: 'app-match-pools',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, PercentPipe,
    MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule,
    MatTabsModule, MatChipsModule, MatTableModule, AppNavComponent, MobileNavComponent],
  template: `
    <app-nav />
    @if (device.isMobile()) {
      <div class="mp-mobile">
        <header class="mobile-header">
          <button mat-icon-button routerLink="/home"><mat-icon>arrow_back</mat-icon></button>
          <h1>Match Pools</h1>
          <button mat-icon-button class="info-btn" (click)="showGuide.set(!showGuide())" matTooltip="How it works">
            <mat-icon>info_outline</mat-icon>
          </button>
          <button mat-icon-button (click)="auth.logout()" matTooltip="Logout"><mat-icon>logout</mat-icon></button>
        </header>

        @if (showGuide()) {
          <div class="guide-bar-mobile">
            <div class="guide-step"><span class="step-num">1</span> Pick a pool &amp; choose a market you predict will win</div>
            <div class="guide-step"><span class="step-num">2</span> Your payout is proportional to your stake share</div>
            <div class="guide-step"><span class="step-num">3</span> Winning market splits the pool among its backers</div>
            <div class="guide-footnote">Losing stakes are not refunded.</div>
          </div>
        }

        <div class="msummary-row">
          <div class="msummary-item">
            <span class="ms-val">{{ mSummary().open }}</span>
            <span class="ms-lbl">Open</span>
          </div>
          <div class="msummary-item">
            <span class="ms-val gold">\u20A6{{ mSummary().poolTotal | number }}</span>
            <span class="ms-lbl">Pool</span>
          </div>
          <div class="msummary-item">
            <span class="ms-val blue">{{ mSummary().myStakes }}</span>
            <span class="ms-lbl">My Stakes</span>
          </div>
        </div>

        <div class="mtabs">
          <button class="mtab" [class.active]="view() === 'list'" (click)="switchView('list')">Open Pools</button>
          <button class="mtab" [class.active]="view() === 'my-stakes'" (click)="switchView('my-stakes')">My Stakes</button>
        </div>

        @if (view() === 'list') {
          @if (service.loading()) {
            <div class="m-loader"><mat-spinner diameter="24" /></div>
          } @else if (service.openPools().length === 0) {
            <div class="m-empty">
              <mat-icon>water_pool</mat-icon>
              <span>No open pools right now</span>
            </div>
          } @else {
            <div class="mcard-stack">
              @for (p of service.openPools(); track p._id) {
                <div class="mcard" [class.expanded]="selectedPoolId() === p._id">
                  <div class="mc-header" (click)="togglePoolExpand(p._id)">
                    <div class="mc-h-left">
                      <strong>{{ p.eventTitle }}</strong>
                      <span class="mc-deadline">Closes {{ p.stakingClosesAt | date:'MMM d, h:mm a' }}</span>
                    </div>
                    <div class="mc-h-right">\u20A6{{ p.totalPool | number }}</div>
                  </div>
                  <div class="mc-markets">
                    @for (m of p.markets; track m.marketId) {
                      <div class="mc-market"
                        [class.selected]="selectedPoolId() === p._id && selectedMarket() === m.marketId"
                        (click)="$event.stopPropagation(); selectMarketOnPool(p._id, m.marketId)">
                        <div class="mc-m-bar" [style.width.%]="(m.totalStaked / (p.totalPool || 1)) * 100"></div>
                        <div class="mc-m-left">
                          <span class="mc-m-label">{{ m.label }}</span>
                          <span class="mc-m-staked">\u20A6{{ m.totalStaked | number }}</span>
                        </div>
                        <div class="mc-m-right">
                          @if (getMarketRank(p.markets, m.marketId) === 0) {
                            <mat-icon class="rank-icon rank-1st" matTooltip="Leading">emoji_events</mat-icon>
                          } @else if (getMarketRank(p.markets, m.marketId) === 1) {
                            <mat-icon class="rank-icon rank-2nd" matTooltip="2nd">workspace_premium</mat-icon>
                          } @else if (getMarketRank(p.markets, m.marketId) === p.markets.length - 1) {
                            <mat-icon class="rank-icon rank-last" matTooltip="Trailing">arrow_downward</mat-icon>
                          }
                          <span class="mc-m-pct">{{ (m.totalStaked / (p.totalPool || 1)) | percent:'1.0-1' }}</span>
                          <mat-icon class="mc-m-check">check_circle</mat-icon>
                        </div>
                      </div>
                    }
                  </div>
                  @if (selectedPoolId() === p._id && selectedMarket()) {
                    <div class="mc-stake">
                      <mat-form-field appearance="outline" class="mc-stake-input">
                        <mat-label>Stake (\u20A6{{ p.minStake }} \u2013 \u20A6{{ p.maxStake | number }})</mat-label>
                        <input matInput type="number" [(ngModel)]="stakeAmount">
                      </mat-form-field>
                      <button mat-raised-button class="mc-stake-btn" (click)="placeStake(p._id)"
                        [disabled]="!stakeAmount || stakeAmount < p.minStake || stakeAmount > p.maxStake || staking()">
                        @if (staking()) { <mat-spinner diameter="18" /> }
                        @else { Place Stake }
                      </button>
                      @if (stakeError()) { <div class="mc-err">{{ stakeError() }}</div> }
                      @if (stakeSuccess()) { <div class="mc-ok">Stake placed!</div> }
                    </div>
                  }
                </div>
              }
            </div>
          }
        }

        @if (view() === 'my-stakes') {
          @if (myStakesLoading()) {
            <div class="m-loader"><mat-spinner diameter="24" /></div>
          } @else if (myStakes().length === 0) {
            <div class="m-empty">
              <mat-icon>casino</mat-icon>
              <span>No stakes yet</span>
            </div>
          } @else {
            <div class="mcard-stack">
              @for (s of myStakes(); track s._id) {
                <div class="mcard">
                  <div class="s-row">
                    <div class="s-left">
                      <strong>{{ s.matchPool?.eventTitle || 'Unknown Event' }}</strong>
                      <span class="s-market">{{ formatMarketName(s.marketId) }}</span>
                    </div>
                    <span class="s-amount">\u20A6{{ s.amount | number }}</span>
                  </div>
                  <div class="s-bottom">
                    <span class="s-chip" [class.won]="s.status === 'won'" [class.lost]="s.status === 'lost'">
                      <mat-icon class="s-chip-icon">{{ s.status === 'won' ? 'emoji_events' : s.status === 'lost' ? 'autorenew' : 'schedule' }}</mat-icon>
                      {{ s.status }}
                    </span>
                    @if (s.payoutAmount) {
                      <span class="s-payout">Payout: \u20A6{{ s.payoutAmount | number }}</span>
                    }
                    <span class="s-date">{{ s.createdAt | date:'MMM d' }}</span>
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>
    } @else {
      <div class="mp-container">
        <div class="page-header">
          <h1>Match Pools
            <button mat-icon-button class="info-btn" (click)="showGuide.set(!showGuide())" matTooltip="How it works">
              <mat-icon>info_outline</mat-icon>
            </button>
          </h1>
        </div>

        @if (showGuide()) {
          <div class="guide-bar">
            <div class="guide-step"><span class="step-num">1</span> Pick a match pool &amp; choose a market you predict will win</div>
            <div class="guide-step"><span class="step-num">2</span> Place your stake — bigger stake means a bigger payout</div>
            <div class="guide-step"><span class="step-num">3</span> If your market wins, you earn a proportional share of the pool</div>
            <div class="guide-footnote">Losing stakes are not refunded. Payout = (your stake \u00F7 winning market total) \u00D7 distributable pool.</div>
          </div>
        }

        <div class="summary-cards">
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon active"><mat-icon>water_pool</mat-icon></div>
              <div class="summary-value">{{ summary().total }}</div>
              <div class="summary-label">Total Pools</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon open"><mat-icon>play_circle</mat-icon></div>
              <div class="summary-value">{{ summary().open }}</div>
              <div class="summary-label">Open Pools</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon pool-val"><mat-icon>account_balance</mat-icon></div>
              <div class="summary-value">\u20A6{{ summary().poolTotal | number }}</div>
              <div class="summary-label">Combined Pool</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon my-stakes"><mat-icon>casino</mat-icon></div>
              <div class="summary-value">{{ summary().myStakes }}</div>
              <div class="summary-label">My Stakes</div>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-tab-group class="content-tabs" (selectedTabChange)="onTabChange($event)">
          <mat-tab label="Open Pools">
            <div class="tab-body">
              @if (service.loading()) {
                <div class="loading-center"><mat-spinner /></div>
              } @else if (service.openPools().length === 0) {
                <div class="empty-state">
                  <mat-icon>water_pool</mat-icon>
                  <h3>No open pools</h3>
                  <p>Check back later for new match pools</p>
                </div>
              } @else {
                <div class="pool-grid">
                  @for (p of service.openPools(); track p._id) {
                    <mat-card class="pool-card" [class.expanded]="selectedPoolId() === p._id">
                      <div class="pc-header" (click)="togglePoolExpand(p._id)">
                        <div class="pc-title-area">
                          <h3>{{ p.eventTitle }}</h3>
                          <span class="pc-deadline">Closes {{ p.stakingClosesAt | date:'MMM d, h:mm a' }}</span>
                        </div>
                        <div class="pc-pool-total">\u20A6{{ p.totalPool | number }}</div>
                      </div>
                      <div class="pc-markets">
                        @for (m of p.markets; track m.marketId) {
                          <div class="pc-market"
                            [class.selected]="selectedPoolId() === p._id && selectedMarket() === m.marketId"
                            (click)="$event.stopPropagation(); selectMarketOnPool(p._id, m.marketId)">
                            <div class="pc-bar" [style.width.%]="(m.totalStaked / (p.totalPool || 1)) * 100"></div>
                            <div class="pm-left">
                              <span class="pm-label">{{ m.label }}</span>
                              <span class="pm-staked">\u20A6{{ m.totalStaked | number }} staked</span>
                            </div>
                            <div class="pm-right">
                              @if (getMarketRank(p.markets, m.marketId) === 0) {
                                <mat-icon class="rank-icon rank-1st" matTooltip="Leading">emoji_events</mat-icon>
                              } @else if (getMarketRank(p.markets, m.marketId) === 1) {
                                <mat-icon class="rank-icon rank-2nd" matTooltip="2nd">workspace_premium</mat-icon>
                              } @else if (getMarketRank(p.markets, m.marketId) === p.markets.length - 1) {
                                <mat-icon class="rank-icon rank-last" matTooltip="Trailing">arrow_downward</mat-icon>
                              }
                              <span class="pm-pct">{{ (m.totalStaked / (p.totalPool || 1)) | percent:'1.0-1' }}</span>
                              <mat-icon class="pm-check">check_circle</mat-icon>
                            </div>
                          </div>
                        }
                      </div>
                      @if (selectedPoolId() === p._id && selectedMarket()) {
                        <div class="pc-stake-form">
                          <div class="psf-row">
                            <mat-form-field appearance="outline" class="psf-input">
                              <mat-label>Stake (\u20A6{{ p.minStake | number }} \u2013 \u20A6{{ p.maxStake | number }})</mat-label>
                              <input matInput type="number" [(ngModel)]="stakeAmount">
                            </mat-form-field>
                            <button mat-raised-button class="btn-emerald" (click)="placeStake(p._id)"
                              [disabled]="!stakeAmount || stakeAmount < p.minStake || stakeAmount > p.maxStake || staking()">
                              @if (staking()) { <mat-spinner diameter="20" /> }
                              @else { <ng-container><mat-icon>bolt</mat-icon> Place Stake</ng-container> }
                            </button>
                          </div>
                          @if (stakeError()) { <div class="psf-error">{{ stakeError() }}</div> }
                          @if (stakeSuccess()) { <div class="psf-success">Stake placed!</div> }
                        </div>
                      }
                    </mat-card>
                  }
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="My Stakes">
            <div class="tab-body">
              @if (myStakesLoading()) {
                <div class="loading-center"><mat-spinner /></div>
              } @else if (myStakes().length === 0) {
                <div class="empty-state">
                  <mat-icon>casino</mat-icon>
                  <h3>No stakes yet</h3>
                  <p>Place your first stake in an open match pool</p>
                </div>
              } @else {
                <div class="stakes-table-wrap">
                  <table mat-table [dataSource]="myStakes()" class="stakes-table">
                    <ng-container matColumnDef="event">
                      <th mat-header-cell *matHeaderCellDef>Event</th>
                      <td mat-cell *matCellDef="let s">{{ s.matchPool?.eventTitle || 'Unknown Event' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="market">
                      <th mat-header-cell *matHeaderCellDef>Market</th>
                      <td mat-cell *matCellDef="let s">{{ formatMarketName(s.marketId) }}</td>
                    </ng-container>
                    <ng-container matColumnDef="amount">
                      <th mat-header-cell *matHeaderCellDef>Stake</th>
                      <td mat-cell *matCellDef="let s">\u20A6{{ s.amount | number }}</td>
                    </ng-container>
                    <ng-container matColumnDef="payout">
                      <th mat-header-cell *matHeaderCellDef>Payout</th>
                      <td mat-cell *matCellDef="let s">
                        @if (s.payoutAmount) { \u20A6{{ s.payoutAmount | number }} }
                        @else { \u2014 }
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef>Status</th>
                      <td mat-cell *matCellDef="let s">
                        <mat-chip [class]="s.status === 'won' ? 'chip-emerald' : s.status === 'lost' ? 'chip-gray' : 'chip-gold'" selected>
                          <mat-icon matChipAvatar>{{ s.status === 'won' ? 'emoji_events' : s.status === 'lost' ? 'autorenew' : 'schedule' }}</mat-icon>
                          {{ s.status }}
                        </mat-chip>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="date">
                      <th mat-header-cell *matHeaderCellDef>Date</th>
                      <td mat-cell *matCellDef="let s">{{ s.createdAt | date:'MMM d, h:mm a' }}</td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="stakeColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: stakeColumns;"></tr>
                  </table>
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    }
    <app-mobile-nav />
  `,
  styles: [`
    .mp-container { max-width: 960px; margin: 0 auto; padding: 60px 24px 40px; color: #fff; }

    /* Mobile layout */
    .mp-mobile { padding: 0 0 80px; min-height: 100vh; background: #0A1428; }

    .mobile-header { display: flex; align-items: center; gap: 4px; padding: 8px 12px; background: #0D1A30; border-bottom: 1px solid rgba(255,255,255,0.06); position: sticky; top: 0; z-index: 10; }
    .mobile-header h1 { flex: 1; margin: 0; font-size: 18px; font-weight: 700; color: #fff; }
    .mobile-header button { color: rgba(255,255,255,0.7); }
    .mobile-header button:hover { color: #00E676; }

    .info-btn { color: rgba(255,255,255,0.3); width: 28px; height: 28px; line-height: 28px; }
    .info-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .info-btn:hover { color: #00E676; }

    .guide-bar-mobile { background: rgba(0,230,118,0.04); border: 1px solid rgba(0,230,118,0.1); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 5px; margin: 8px 12px 0; }
    .guide-bar-mobile .guide-step { font-size: 12px; color: rgba(255,255,255,0.65); display: flex; align-items: center; gap: 7px; }
    .guide-bar-mobile .step-num { width: 18px; height: 18px; border-radius: 50%; background: rgba(0,230,118,0.15); color: #00E676; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .guide-bar-mobile .guide-footnote { font-size: 10px; color: rgba(255,255,255,0.3); font-style: italic; margin-top: 1px; }

    /* Mobile summary row (3 cards) */
    .msummary-row { display: flex; gap: 6px; padding: 8px 12px 0; }
    .msummary-item { flex: 1; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 4px; text-align: center; }
    .ms-val { display: block; font-size: 16px; font-weight: 700; color: #fff; }
    .ms-val.gold { color: #E8B923; }
    .ms-val.blue { color: #64B5F6; }
    .ms-lbl { display: block; font-size: 9px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.4px; margin-top: 1px; }

    /* Mobile tabs */
    .mtabs { display: flex; gap: 4px; background: rgba(255,255,255,0.04); border-radius: 10px; padding: 3px; margin: 8px 12px 0; }
    .mtab { flex: 1; padding: 7px 12px; border: none; border-radius: 8px; background: transparent; color: rgba(255,255,255,0.5); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .mtab.active { background: #00E676; color: #0A1428; }

    /* Mobile loader / empty */
    .m-loader { display: flex; justify-content: center; padding: 32px; }
    .m-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px 16px; text-align: center; color: rgba(255,255,255,0.3); font-size: 13px; }
    .m-empty mat-icon { font-size: 32px; width: 32px; height: 32px; opacity: 0.4; }

    /* Mobile card stack */
    .mcard-stack { display: flex; flex-direction: column; gap: 8px; padding: 12px; }
    .mcard { background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; transition: border-color 0.2s; }
    .mcard.expanded { border-color: rgba(0,230,118,0.15); }

    .mc-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; cursor: pointer; }
    .mc-header:active { background: rgba(255,255,255,0.02); }
    .mc-h-left { display: flex; flex-direction: column; gap: 1px; flex: 1; }
    .mc-h-left strong { font-size: 14px; font-weight: 600; color: #fff; }
    .mc-deadline { font-size: 11px; color: rgba(255,255,255,0.3); }
    .mc-h-right { font-size: 16px; font-weight: 700; color: #00E676; white-space: nowrap; margin-left: 8px; }

    .mc-markets { border-top: 1px solid rgba(255,255,255,0.04); }
    .mc-market { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.02); position: relative; overflow: hidden; }
    .mc-market:last-child { border-bottom: none; }
    .mc-market:active { background: rgba(255,255,255,0.02); }
    .mc-market.selected { background: rgba(0,230,118,0.04); border-left: 2px solid #00E676; }
    .mc-m-bar { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(90deg, rgba(0,230,118,0.08), rgba(0,230,118,0.15)); transition: width 0.4s ease; pointer-events: none; }
    .mc-market.selected .mc-m-bar { background: linear-gradient(90deg, rgba(0,230,118,0.12), rgba(0,230,118,0.22)); }
    .mc-m-left { display: flex; flex-direction: column; gap: 1px; position: relative; z-index: 1; }
    .mc-m-label { font-size: 13px; font-weight: 500; color: #fff; }
    .mc-m-staked { font-size: 10px; color: rgba(255,255,255,0.35); }
    .mc-m-right { display: flex; align-items: center; gap: 6px; position: relative; z-index: 1; }
    .mc-m-pct { font-size: 11px; color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.04); padding: 2px 6px; border-radius: 5px; }
    .mc-m-check { font-size: 16px; width: 16px; height: 16px; color: #00E676; opacity: 0; transition: opacity 0.2s; }
    .mc-market.selected .mc-m-check { opacity: 1; }

    .rank-icon { font-size: 16px; width: 16px; height: 16px; line-height: 16px; display: inline-flex; align-items: center; }
    .rank-1st { color: #FFD700; }
    .rank-2nd { color: #B0BEC5; }
    .rank-last { color: rgba(255,255,255,0.2); }

    .mc-stake { padding: 10px 14px; background: rgba(0,230,118,0.02); border-top: 1px solid rgba(0,230,118,0.06); }
    .mc-stake-input { width: 100%; }
    .mc-stake-btn { width: 100%; margin-top: 6px; background: linear-gradient(135deg, #00E676, #00C853) !important; color: #0A1428 !important; font-weight: 600 !important; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 40px; border: none !important; border-radius: 8px; }
    .mc-stake-btn:disabled { opacity: 0.4; }
    .mc-err { margin-top: 6px; font-size: 11px; color: #f44336; padding: 5px 8px; background: rgba(244,67,54,0.08); border-radius: 6px; }
    .mc-ok { margin-top: 6px; font-size: 11px; color: #00E676; padding: 5px 8px; background: rgba(0,230,118,0.08); border-radius: 6px; }

    /* My Stakes cards (mobile) */
    .s-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 14px 6px; }
    .s-left { display: flex; flex-direction: column; gap: 1px; flex: 1; }
    .s-left strong { font-size: 14px; font-weight: 600; color: #fff; }
    .s-market { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: capitalize; }
    .s-amount { font-size: 16px; font-weight: 700; color: #00E676; white-space: nowrap; margin-left: 8px; }
    .s-bottom { display: flex; align-items: center; gap: 8px; padding: 4px 14px 10px; flex-wrap: wrap; }
    .s-chip { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; padding: 2px 8px; border-radius: 6px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); text-transform: capitalize; }
    .s-chip.won { background: rgba(0,230,118,0.12); color: #00E676; }
    .s-chip.lost { background: rgba(244,67,54,0.12); color: #f44336; }
    .s-chip .s-chip-icon { font-size: 14px; width: 14px; height: 14px;  }
    .s-payout { font-size: 11px; color: #E8B923; font-weight: 500; }
    .s-date { font-size: 10px; color: rgba(255,255,255,0.25); margin-left: auto; }

    /* Page header */
    .page-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 0 16px; }
    .page-header h1 { margin: 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .page-header .info-btn { color: rgba(255,255,255,0.25); }
    .page-header .info-btn:hover { color: #00E676; }

    /* Guide bar */
    .guide-bar { background: rgba(0,230,118,0.04); border: 1px solid rgba(0,230,118,0.08); border-radius: 12px; padding: 14px 18px; display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
    .guide-bar .guide-step { font-size: 13px; color: rgba(255,255,255,0.7); display: flex; align-items: center; gap: 8px; }
    .guide-bar .step-num { width: 20px; height: 20px; border-radius: 50%; background: rgba(0,230,118,0.12); color: #00E676; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .guide-bar .guide-footnote { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 2px; font-style: italic; }

    /* Summary cards (bets style) */
    .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .summary-card { text-align: center; padding: 12px 8px; background: #0D1A30 !important; border: 1px solid rgba(255,255,255,0.06) !important; border-radius: 12px !important; color: #fff !important; box-shadow: none !important; }
    .summary-card .mat-mdc-card-content { padding: 0; }
    .summary-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-size: 20px; }
    .summary-icon.active { background: rgba(0,230,118,0.12); color: #00E676; }
    .summary-icon.open { background: rgba(0,230,118,0.12); color: #00E676; }
    .summary-icon.pool-val { background: rgba(232,185,35,0.12); color: #E8B923; }
    .summary-icon.my-stakes { background: rgba(100,181,246,0.12); color: #64B5F6; }
    .summary-value { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
    .summary-label { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; }

    /* Content tabs (bets style) */
    .content-tabs { background: #0D1A30; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }
    ::ng-deep .content-tabs .mat-mdc-tab-header { background: #0D1A30; }
    ::ng-deep .content-tabs .mat-mdc-tab .mdc-tab__text-label { color: #00E676; font-size: 14px; font-weight: 600; }
    ::ng-deep .content-tabs .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label { color: #00E676; font-weight: 700; }
    ::ng-deep .content-tabs .mat-mdc-tab-indicator .mdc-tab-indicator__content { border-color: #00E676; }
    .tab-body { padding: 20px; min-height: 200px; }
    .loading-center { display: flex; justify-content: center; padding: 40px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px 16px; text-align: center; }
    .empty-state mat-icon { font-size: 44px; width: 44px; height: 44px; margin-bottom: 12px; opacity: 0.4; color: rgba(255,255,255,0.4); }
    .empty-state h3 { margin: 0 0 4px; font-size: 16px; color: #fff; }
    .empty-state p { margin: 0; font-size: 13px; color: rgba(255,255,255,0.4); }

    /* Pool cards */
    .pool-grid { display: flex; flex-direction: column; gap: 12px; }
    .pool-card { background: #0F1B30 !important; border: 1px solid rgba(255,255,255,0.05) !important; border-radius: 14px !important; padding: 0 !important; overflow: hidden; transition: border-color 0.2s; box-shadow: none !important; }
    .pool-card.expanded { border-color: rgba(0,230,118,0.15) !important; }
    .pc-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; cursor: pointer; transition: background 0.15s; }
    .pc-header:hover { background: rgba(255,255,255,0.02); }
    .pc-title-area h3 { margin: 0 0 2px; font-size: 16px; font-weight: 600; color: #fff; }
    .pc-deadline { font-size: 12px; color: rgba(255,255,255,0.3); }
    .pc-pool-total { font-size: 20px; font-weight: 700; color: #00E676; white-space: nowrap; margin-left: 12px; }
    .pc-markets { border-top: 1px solid rgba(255,255,255,0.04); }
    .pc-market { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; cursor: pointer; transition: all 0.15s; border-bottom: 1px solid rgba(255,255,255,0.02); position: relative; overflow: hidden; }
    .pc-market:last-child { border-bottom: none; }
    .pc-market:hover { background: rgba(255,255,255,0.02); }
    .pc-market.selected { background: rgba(0,230,118,0.04); border-left: 3px solid #00E676; }
    .pc-bar { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(90deg, rgba(0,230,118,0.08), rgba(0,230,118,0.15)); transition: width 0.4s ease; pointer-events: none; }
    .pc-market.selected .pc-bar { background: linear-gradient(90deg, rgba(0,230,118,0.12), rgba(0,230,118,0.22)); }
    .pm-left { display: flex; flex-direction: column; gap: 1px; position: relative; z-index: 1; }
    .pm-label { font-size: 14px; font-weight: 500; color: #fff; }
    .pm-staked { font-size: 11px; color: rgba(255,255,255,0.35); }
    .pm-right { display: flex; align-items: center; gap: 8px; position: relative; z-index: 1; }
    .pm-pct { font-size: 12px; color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.04); padding: 2px 8px; border-radius: 6px; }
    .pm-check { font-size: 18px; width: 18px; height: 18px; color: #00E676; opacity: 0; transition: opacity 0.2s; }
    .pc-market.selected .pm-check { opacity: 1; }

    /* Stake form */
    .pc-stake-form { padding: 14px 20px; background: rgba(0,230,118,0.02); border-top: 1px solid rgba(0,230,118,0.06); }
    .psf-row { display: flex; gap: 10px; align-items: flex-start; }
    .psf-input { flex: 1; }
    .psf-error { margin-top: 8px; font-size: 12px; color: #f44336; padding: 6px 10px; background: rgba(244,67,54,0.08); border-radius: 6px; }
    .psf-success { margin-top: 8px; font-size: 12px; color: #00E676; padding: 6px 10px; background: rgba(0,230,118,0.08); border-radius: 6px; }

    /* Stakes table */
    .stakes-table-wrap { overflow-x: auto; }
    .stakes-table { width: 100%; }
    ::ng-deep .stakes-table .mat-mdc-header-row { background: #162245; }
    ::ng-deep .stakes-table .mat-mdc-header-cell { color: rgba(255,255,255,0.6); font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    ::ng-deep .stakes-table .mat-mdc-cell { color: #fff; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.04); padding: 10px 8px; }

    .stakes-table mat-chip mat-icon { color: rgba(255,255,255,0.6); font-size: 16px; width: 16px; height: 16px; }

    /* Utility */
    .btn-emerald { background: linear-gradient(135deg, #00E676, #00C853) !important; color: #0A1428 !important; border: none !important; display: inline-flex; align-items: center; gap: 6px; font-weight: 600 !important; padding: 0 20px !important; height: 40px; }
    .btn-emerald:disabled { opacity: 0.4; }
    ::ng-deep .btn-emerald mat-icon { color: #0A1428 !important; }
    ::ng-deep .chip-emerald { background: rgba(0,230,118,0.15) !important; --mdc-chip-label-text-color: #00E676; }
    ::ng-deep .chip-gold { background: rgba(232,185,35,0.15) !important; --mdc-chip-label-text-color: #E8B923; }
    ::ng-deep .chip-gray { background: rgba(255,255,255,0.08) !important; --mdc-chip-label-text-color: rgba(255,255,255,0.6); }
    ::ng-deep .mat-mdc-chip.mat-mdc-standard-chip { background: transparent; }
  `]
})
export class MatchPoolsComponent implements OnInit {
  device = inject(DeviceService);
  service = inject(MatchPoolService);
  auth = inject(AuthService);

  view = signal<View>('list');
  showGuide = signal(false);
  selectedMarket = signal<string>('');

  mSummary = computed(() => {
    const open = this.service.openPools();
    return {
      open: open.length,
      poolTotal: open.reduce((s, p) => s + p.totalPool, 0),
      myStakes: this.myStakes().length
    };
  });

  // Stake
  stakeAmount = 0;
  staking = signal(false);
  stakeError = signal('');
  stakeSuccess = signal(false);

  // My Stakes
  myStakes = signal<MyPoolStake[]>([]);
  myStakesLoading = signal(false);

  // Desktop multi-pool selection
  selectedPoolId = signal<string | null>(null);
  stakeColumns = ['event', 'market', 'amount', 'payout', 'status', 'date'];

  summary = signal({ total: 0, open: 0, poolTotal: 0, myStakes: 0 });

  ngOnInit() {
    this.service.fetchPools();
    // Update summary when pools change
    this.computeSummary();
  }

  private computeSummary() {
    const pools = this.service.pools();
    const open = this.service.openPools();
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

    this.service.stake(poolId, marketId, this.stakeAmount).subscribe({
      next: (res) => {
        if (res.success) {
          this.stakeSuccess.set(true);
          this.stakeAmount = 0;
          this.selectedMarket.set('');
          this.selectedPoolId.set(null);
          this.service.fetchPools();
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
    this.service.fetchMyStakes().subscribe({
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

  formatMarketName(marketId: string): string {
    return marketId.replace(/_/g, ' ');
  }

  getMarketRank(markets: { marketId: string; totalStaked: number }[], marketId: string): number {
    const sorted = [...markets].sort((a, b) => b.totalStaked - a.totalStaked);
    return sorted.findIndex(m => m.marketId === marketId);
  }
}
