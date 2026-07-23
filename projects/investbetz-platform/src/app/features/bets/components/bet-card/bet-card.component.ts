import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Stake } from '../../../../core/services';

@Component({
  selector: 'app-bet-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatBadgeModule, MatDividerModule],
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
