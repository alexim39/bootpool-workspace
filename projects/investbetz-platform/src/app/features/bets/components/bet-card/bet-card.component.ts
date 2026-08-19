import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Stake } from '../../../../core/services';
import { AutoCashoutComponent } from '../auto-cashout/auto-cashout.component';
import { kickoffCountdown } from '../../../games/game-status.util';

@Component({
  selector: 'app-bet-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatBadgeModule, MatDividerModule, AutoCashoutComponent],
  templateUrl: './bet-card.component.html',
  styleUrls: ['./bet-card.component.scss']
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
    if (status === 'confirmed') return 'Active';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatResultLabel(stake: Stake): string {
    if (stake.status === 'lost') return this.hasRefund(stake) ? 'Refunded' : 'Lost';
    if (stake.status === 'void') return 'Voided';
    if (stake.status === 'refunded') return 'Refunded';
    if (stake.status === 'cancelled') return 'Cancelled';
    return this.formatStatus(stake.status);
  }

  hasRefund(stake: Stake): boolean {
    return !stake.isParlay && (stake.refundAmount || 0) > 0;
  }

  hasScore(target: { homeScore?: number | null; awayScore?: number | null } | undefined | null): boolean {
    return !!target && target.homeScore != null && target.awayScore != null;
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

  matchTime(matchDate: string | undefined | null): string {
    if (!matchDate) return '';
    return new Date(matchDate).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  }

  matchDay(matchDate: string | undefined | null): string {
    if (!matchDate) return '';
    const d = new Date(matchDate);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    const day = d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    if (d.toDateString() === today.toDateString()) return `Today · ${day}`;
    if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow · ${day}`;
    return day;
  }

  matchCountdown(matchDate: string | undefined | null): string {
    if (!matchDate) return '';
    return kickoffCountdown(matchDate);
  }

  isUpcomingMatchDate(matchDate: string | undefined | null): boolean {
    return !!matchDate && new Date(matchDate).getTime() > Date.now();
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
