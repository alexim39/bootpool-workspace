import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { OraRecordService, OraRecord } from '../../../../core/services';

@Component({
  selector: 'app-ora-performance',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './ora-performance.component.html',
  styleUrls: ['./ora-performance.component.scss']
})
export class OraPerformanceComponent implements OnInit {
  private recordService = inject(OraRecordService);

  readonly Math = Math;

  readonly record = signal<OraRecord | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly CIRCUMFERENCE = 2 * Math.PI * 52;

  readonly overall = computed(() => this.record()?.overall ?? null);
  readonly winRate = computed(() => Math.round(this.overall()?.winRate ?? 0));
  readonly played = computed(() => this.overall()?.played ?? 0);
  readonly won = computed(() => this.overall()?.won ?? 0);
  readonly lost = computed(() => Math.max(0, this.played() - this.won()));
  readonly leagues = computed(() => (this.record()?.byLeague ?? []).slice(0, 6));
  readonly daily = computed(() => this.record()?.daily ?? []);

  readonly maxDaily = computed(() => {
    const peak = Math.max(0, ...this.daily().map(d => d.played));
    return peak > 0 ? peak : 1;
  });

  readonly dashOffset = computed(() => {
    const rate = Math.min(100, Math.max(0, this.winRate()));
    return this.CIRCUMFERENCE * (1 - rate / 100);
  });

  barPct(n: number): number {
    return n > 0 ? Math.max(10, (n / this.maxDaily()) * 100) : 0;
  }

  isToday(day: string): boolean {
    return day === new Date().toISOString().slice(0, 10);
  }

  dayLabel(day: string): string {
    return new Date(day + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short' });
  }

  dateLabel(day: string): string {
    return new Date(day + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  dailyTooltip(d: { day: string; played: number; won: number; winRate: number }): string {
    if (!d.played) return `${this.dateLabel(d.day)} — no settled picks`;
    return `${this.dateLabel(d.day)} — Won ${d.won} · Lost ${d.played - d.won} (${d.winRate}%)`;
  }

  ngOnInit() {
    this.recordService.getRecord().subscribe({
      next: res => {
        if (res.success) this.record.set(res.data);
        else this.error.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }
}
