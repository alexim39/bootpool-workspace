import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Stake } from '../../core/services/stake.service';

@Component({
  selector: 'app-bet-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatBadgeModule, MatDividerModule],
  template: `
    <mat-card class="bet-card" [class.settled]="stake.isSettled">
      <mat-card-content>
        <div class="bet-header">
          <div class="bet-status">
            <mat-chip [class]="getStatusClass(stake.status)" selected>
              <mat-icon matChipAvatar>{{ getStatusIcon(stake.status) }}</mat-icon>
              {{ formatStatus(stake.status) }}
            </mat-chip>
            @if (stake.status === 'confirmed' && !stake.isSettled) {
              <mat-chip class="chip-cashout" selected>
                <mat-icon matChipAvatar>autorenew</mat-icon>
                Cashout Available
              </mat-chip>
            }
          </div>
          <div class="bet-date">{{ formatDay(stake.createdAt) }}</div>
        </div>

        @if (stake.isParlay && stake.items) {
          <div class="parlay-badge">ACCUMULATOR ({{ stake.items.length }} legs)</div>
          <div class="parlay-legs">
            @for (item of stake.items; track item.pod) {
              <div class="parlay-leg">
                <span class="leg-teams">{{ item.homeTeam }} vs {{ item.awayTeam }}</span>
                <span class="leg-odds">{{ item.gainsMultiplier.toFixed(2) }}x</span>
                <span class="leg-selection">{{ item.selection }}</span>
              </div>
            }
          </div>
          <div class="bet-selection">
            <span class="odds parlay-odds">{{ stake.combinedMultiplier?.toFixed(2) }}x</span>
            <span class="parlay-label">Combined Odds</span>
          </div>
        } @else {
          <div class="bet-match">
            <div class="match-teams">
              <span class="team home">{{ stake.pod.homeTeam }}</span>
              <mat-icon>sports_soccer</mat-icon>
              <span class="team away">{{ stake.pod.awayTeam }}</span>
            </div>
            <div class="match-info">
              <span class="league" *ngIf="stake.pod.league">{{ stake.pod.league }}</span>
              <span class="market-type" *ngIf="stake.pod.marketType">{{ stake.pod.marketType }}</span>
              <span class="refund-chip" *ngIf="stake.pod.refundPercent">{{ stake.pod.refundPercent }}% cash back</span>
              <span class="match-time" *ngIf="stake.pod.matchDate">
                {{ formatMatchTime(stake.pod.matchDate) }}
              </span>
            </div>
          </div>

          @if (stake.isSettled) {
            <div class="bet-selection">
              <span class="selection">{{ stake.pod.selection }}</span>
              <span class="odds">{{ stake.pod.gainsMultiplier.toFixed(2) }}x</span>
            </div>
          } @else {
            <div class="bet-selection">
              <span class="odds">{{ stake.pod.gainsMultiplier.toFixed(2) }}x</span>
            </div>
          }
        }

        <mat-divider></mat-divider>

        <div class="bet-details">
          <div class="detail-row">
            <span class="detail-label">Stake</span>
            <span class="detail-value stake-amount">{{ formatCurrency(stake.stakeAmount) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Potential Payout</span>
            <span class="detail-value payout">{{ formatCurrency(stake.netPayout) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Platform Fee</span>
            <span class="detail-value fee">{{ formatCurrency(stake.platformFee) }}</span>
          </div>
        </div>

        <div class="bet-actions" *ngIf="showActions && !stake.isSettled && !stake.isParlay">
          <button mat-stroked-button class="btn-cashout-action" (click)="onCashout(stake.id)">
            <mat-icon>autorenew</mat-icon> Request Cashout
          </button>
        </div>

        <div class="settled-result" *ngIf="stake.isSettled">
          @if (stake.status === 'won') {
            <div class="result-label">Won</div>
            <div class="profit positive">+{{ formatCurrency(stake.profit!) }}</div>
          } @else if (stake.status === 'cashed_out') {
            <div class="result-label">Cashed Out</div>
            <div class="profit neutral">{{ formatCurrency(stake.profit!) }}</div>
          } @else {
            <div class="result-label">Refunded</div>
            <div class="profit neutral">{{ formatCurrency(stake.stakeAmount) }}</div>
          }
          <div class="settled-time" *ngIf="stake.settledAt">
            Settled {{ formatTime(stake.settledAt) }}
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .bet-card { margin-bottom: 12px; border-radius: 14px; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); color: #FFFFFF; }
    .bet-card.settled { opacity: 0.7; }
    .bet-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .bet-status { display: flex; flex-direction: column; gap: 4px; }
    .bet-status mat-chip { font-size: 10px; height: 24px; padding: 0 8px; border-radius: 12px; font-weight: 500; }
    .bet-status mat-chip mat-icon { font-size: 14px; width: 14px; height: 14px; color: #00E676; }
    .chip-cashout { font-size: 10px; height: 24px; background: rgba(0,230,118,0.15) !important; --mdc-chip-label-text-color: #00E676; color: #00E676; }
    .bet-date { font-size: 11px; color: rgba(255,255,255,0.4); }
    .bet-match { margin-bottom: 8px; }
    .match-teams { display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #FFFFFF; }
    .match-teams mat-icon { font-size: 16px; width: 16px; height: 16px; color: rgba(255,255,255,0.3); }
    .match-info { display: flex; justify-content: center; gap: 12px; font-size: 11px; color: rgba(255,255,255,0.5); }
    .league { background: rgba(0,230,118,0.1); color: #00E676; padding: 2px 6px; border-radius: 4px; font-weight: 500; }
    .market-type { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); padding: 2px 6px; border-radius: 4px; font-weight: 500; }
    .refund-chip { background: rgba(232,185,35,0.15); color: #E8B923; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
    .parlay-badge { text-align: center; font-size: 11px; font-weight: 700; color: #CE93D8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .parlay-legs { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
    .parlay-leg { display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding: 4px 8px; background: rgba(255,255,255,0.03); border-radius: 6px; }
    .leg-teams { color: #FFFFFF; font-weight: 500; }
    .leg-odds { color: #E8B923; font-weight: 600; }
    .leg-selection { color: #00E676; font-size: 11px; }
    .parlay-odds { color: #CE93D8; }
    .parlay-label { display: block; font-size: 10px; color: rgba(255,255,255,0.4); text-align: right; }
    .bet-selection { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); }
    .selection { font-size: 13px; font-weight: 500; color: #00E676; display: block; }
    .odds { font-size: 18px; font-weight: 700; color: #E8B923; }
    .bet-details { display: flex; flex-direction: column; gap: 8px; padding: 10px 0; }
    .detail-row { display: flex; justify-content: space-between; font-size: 13px; }
    .detail-label { color: rgba(255,255,255,0.5); }
    .detail-value { font-weight: 500; color: #FFFFFF; }
    .detail-value.stake-amount { color: #00E676; }
    .detail-value.payout { color: #00E676; }
    .detail-value.fee { color: #f44336; font-size: 11px; }
    .bet-actions { margin-top: 12px; width: 100%; }
    .bet-actions button { width: 100%; }
    .btn-cashout-action { border-color: #00E676 !important; color: #00E676 !important; font-weight: 600; }
    .settled-result { text-align: center; padding-top: 12px; }
    .result-label { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
    .profit { font-size: 20px; font-weight: 700; margin: 4px 0; }
    .profit.positive { color: #00E676; }
    .profit.negative { color: rgba(255,255,255,0.5); }
    .profit.neutral { color: rgba(255,255,255,0.5); }
    .settled-time { font-size: 11px; color: rgba(255,255,255,0.4); }
    mat-card-content { padding: 16px; }
    ::ng-deep .mat-mdc-chip.mat-mdc-standard-chip { background: transparent; }
    ::ng-deep .chip-emerald { background: rgba(0,230,118,0.15) !important; --mdc-chip-label-text-color: #00E676; }
    ::ng-deep .chip-gold { background: rgba(232,185,35,0.15) !important; --mdc-chip-label-text-color: #E8B923; }
    ::ng-deep .chip-gray { background: rgba(255,255,255,0.08) !important; --mdc-chip-label-text-color: rgba(255,255,255,0.6); }
    ::ng-deep .chip-blue { background: rgba(100,181,246,0.15) !important; --mdc-chip-label-text-color: #64B5F6; }
    ::ng-deep .mat-divider { border-top-color: rgba(255,255,255,0.06) !important; }
  `]
})
export class BetCardComponent {
  @Input({ required: true }) stake!: Stake;
  @Input() showActions = false;
  @Output() cashoutRequested = new EventEmitter<string>();

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount || 0);
  }

  formatStatus(status: Stake['status']): string {
    if (status === 'cashed_out') return 'Cashed Out';
    if (status === 'lost') return 'Refunded';
    if (status === 'confirmed') return 'Active';
    return status.charAt(0).toUpperCase() + status.slice(1);
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

  formatMatchTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < 1) return 'Starting soon';
    if (diffHours < 24) return `In ${Math.floor(diffHours)}h`;
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
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

  onCashout(stakeId: string) {
    this.cashoutRequested.emit(stakeId);
  }
}
