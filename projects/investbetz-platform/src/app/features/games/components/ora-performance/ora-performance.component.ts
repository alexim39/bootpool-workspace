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

  readonly dashOffset = computed(() => {
    const rate = Math.min(100, Math.max(0, this.winRate()));
    return this.CIRCUMFERENCE * (1 - rate / 100);
  });

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
