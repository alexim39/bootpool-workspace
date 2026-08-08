import { Component, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BetSummary } from '../../../../core/services';

@Component({
  selector: 'app-bets-win-loss-chart',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './bets-win-loss-chart.component.html',
  styleUrls: ['./bets-win-loss-chart.component.scss']
})
export class BetsWinLossChartComponent {
  readonly summary = input<BetSummary | null>(null);
  readonly loading = input(false);

  readonly Math = Math;

  readonly hover = signal(-1);

  readonly overall = computed(() => this.summary()?.overall ?? null);
  readonly days = computed(() => this.summary()?.daily ?? []);
  readonly maxPlayed = computed(() => Math.max(1, ...this.days().map(d => d.played)));
  readonly hasData = computed(() => this.days().some(d => d.played > 0));
  readonly totalWon = computed(() => this.days().reduce((s, d) => s + d.won, 0));
  readonly totalLost = computed(() => this.days().reduce((s, d) => s + d.lost, 0));

  barHeight(day: { played: number }): number {
    if (!day.played) return 0;
    return Math.max(10, (day.played / this.maxPlayed()) * 100);
  }

  isToday(date: string): boolean {
    return date === new Date().toISOString().slice(0, 10);
  }

  dayLabel(date: string): string {
    return new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  tickLabel(date: string): string {
    return new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
  }

  fullLabel(date: string): string {
    return new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  readonly tooltip = computed(() => {
    const i = this.hover();
    const ds = this.days();
    if (i < 0 || i >= ds.length) return null;
    const d = ds[i];
    return {
      left: ((i + 0.5) / ds.length) * 100,
      date: this.fullLabel(d.date),
      won: d.won,
      lost: d.lost,
      played: d.played,
      staked: d.staked,
      net: d.net,
      rate: d.won + d.lost > 0 ? Math.round((d.won / (d.won + d.lost)) * 100) : 0,
      today: this.isToday(d.date)
    };
  });

  formatNaira(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(amount));
  }

  onMove(ev: MouseEvent): void {
    const el = ev.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const xPct = Math.min(100, Math.max(0, ((ev.clientX - rect.left) / rect.width) * 100));
    const n = this.days().length;
    this.hover.set(n <= 1 ? 0 : Math.min(n - 1, Math.floor((xPct / 100) * n)));
  }
}
