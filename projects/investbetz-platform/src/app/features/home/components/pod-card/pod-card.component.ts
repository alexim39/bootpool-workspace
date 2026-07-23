import { Component, Output, EventEmitter, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Pod } from '../../../../core/services';

@Component({
  selector: 'app-pod-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './pod-card.component.html',
  styleUrls: ['./pod-card.component.scss']
})
export class PodCardComponent {
  pod = input.required<Pod>();
  selected = input(false);
  selectionDisabled = input(false);
  @Output() placeStake = new EventEmitter<Pod>();
  @Output() toggleSelect = new EventEmitter<Pod>();

  timeRemaining = computed(() => {
    const now = Date.now();
    return Math.max(0, new Date(this.pod().stakingClosesAt).getTime() - now);
  });

  exposurePercent = computed(() => {
    const p = this.pod();
    if (!p.maxTotalExposure || p.maxTotalExposure === 0) return 0;
    return (p.currentExposure || 0) / p.maxTotalExposure * 100;
  });

  gainsTooltip = computed(() => {
    return `Gains: ${this.pod().gainsMultiplier.toFixed(1)}x`;
  });

  formatCountdown(ms: number): string {
    if (ms <= 0) return 'Closed';
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const parts = [];
    if (days > 0) parts.push(`${days.toString().padStart(2, '0')}d`);
    if (hours > 0 || days > 0) parts.push(`${hours.toString().padStart(2, '0')}h`);
    if (mins > 0 || hours > 0 || days > 0) parts.push(`${mins.toString().padStart(2, '0')}m`);
    parts.push(`${secs.toString().padStart(2, '0')}s`);
    return parts.join(' : ');
  }

  isOfferClosed(): boolean {
    return this.timeRemaining() <= 0 || this.pod().status !== 'active';
  }

  onPlaceStake() {
    this.placeStake.emit(this.pod());
  }

  onToggleSelect() {
    this.toggleSelect.emit(this.pod());
  }
}
