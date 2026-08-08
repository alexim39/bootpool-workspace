import { Component, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NavData } from '../../services/bet-manager.service';

interface Pt {
  date: string;
  nav: number;
}

@Component({
  selector: 'app-tier-progress-chart',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './tier-progress-chart.component.html',
  styleUrls: ['./tier-progress-chart.component.scss']
})
export class TierProgressChartComponent {
  static uid = 0;

  readonly nav = input<NavData | null>(null);
  readonly color = input('#00E676');

  readonly gradId = `tpcGrad${++TierProgressChartComponent.uid}`;
  readonly W = 640;
  readonly H = 250;
  readonly PAD_L = 12;
  readonly PAD_R = 78;
  readonly PAD_T = 22;
  readonly PAD_B = 30;

  readonly hover = signal(-1);

  readonly pts = computed<Pt[]>(() => this.nav()?.daily ?? []);

  readonly chartW = computed(() => this.W - this.PAD_L - this.PAD_R);
  readonly chartH = computed(() => this.H - this.PAD_T - this.PAD_B);

  private readonly range = computed(() => {
    const ps = this.pts();
    if (!ps.length) return { min: 0, max: 1 };
    const rawMin = Math.min(...ps.map(p => p.nav));
    const rawMax = Math.max(...ps.map(p => p.nav));
    const pad = (rawMax - rawMin) * 0.18 || 0.002;
    return { min: rawMin - pad, max: rawMax + pad };
  });

  private yOf(v: number): number {
    const { min, max } = this.range();
    return this.PAD_T + (1 - (v - min) / (max - min)) * this.chartH();
  }

  private xOf(i: number): number {
    const n = this.pts().length;
    return n <= 1 ? this.PAD_L : this.PAD_L + (i / (n - 1)) * this.chartW();
  }

  xFullPct(i: number): number {
    return (this.xOf(i) / this.W) * 100;
  }

  topFullPct(v: number): number {
    return (this.yOf(v) / this.H) * 100;
  }

  readonly grid = computed(() => {
    const { min, max } = this.range();
    const rows: Array<{ y: number; top: number; label: string }> = [];
    for (let i = 0; i <= 3; i++) {
      const v = min + ((max - min) * i) / 3;
      const y = this.yOf(v);
      rows.push({ y, top: (y / this.H) * 100, label: v.toFixed(4) });
    }
    return rows;
  });

  private curvePath(n: number): string {
    if (n < 2) return '';
    const X = (i: number) => this.xOf(Math.max(0, Math.min(n - 1, i)));
    const Y = (i: number) => this.yOf(this.pts()[Math.max(0, Math.min(n - 1, i))].nav);
    if (n === 2) return `M ${X(0)} ${Y(0)} L ${X(1)} ${Y(1)}`;
    let d = `M ${X(0)} ${Y(0)}`;
    for (let i = 0; i < n - 1; i++) {
      const c1x = X(i) + (X(i + 1) - X(i - 1)) / 6;
      const c1y = Y(i) + (Y(i + 1) - Y(i - 1)) / 6;
      const c2x = X(i + 1) - (X(i + 2) - X(i)) / 6;
      const c2y = Y(i + 1) - (Y(i + 2) - Y(i)) / 6;
      d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${X(i + 1).toFixed(2)} ${Y(i + 1).toFixed(2)}`;
    }
    return d;
  }

  readonly linePath = computed(() => this.curvePath(this.pts().length));

  readonly areaPath = computed(() => {
    const n = this.pts().length;
    if (n < 2) return '';
    const base = this.PAD_T + this.chartH();
    return `${this.curvePath(n)} L ${this.xOf(n - 1)} ${base} L ${this.xOf(0)} ${base} Z`;
  });

  readonly xTicks = computed(() => {
    const ps = this.pts();
    if (!ps.length) return [];
    const n = ps.length;
    const idxs = n <= 4
      ? ps.map((_, i) => i)
      : [0, Math.floor((n - 1) * 0.25), Math.floor((n - 1) * 0.5), Math.floor((n - 1) * 0.75), n - 1];
    return idxs
      .filter((v, i, a) => a.indexOf(v) === i)
      .map(i => ({ left: this.xFullPct(i), label: this.dayLabel(ps[i].date) }));
  });

  readonly cycleMarkers = computed(() => {
    const ps = this.pts();
    if (ps.length < 2) return [];
    const t0 = +new Date(ps[0].date + 'T00:00:00Z');
    const t1 = +new Date(ps[ps.length - 1].date + 'T00:00:00Z');
    if (t1 <= t0) return [];
    const out: Array<{ left: number; label: string }> = [];
    for (const c of (this.nav()?.history ?? [])) {
      const t = +new Date(c.startDate);
      if (t < t0 || t > t1) continue;
      const left = ((this.PAD_L + ((t - t0) / (t1 - t0)) * this.chartW()) / this.W) * 100;
      out.push({ left, label: `C${c.cycleNumber}` });
    }
    return out;
  });

  readonly activeCycle = computed(() => (this.nav()?.history ?? []).find(c => !c.endingNav) ?? null);

  readonly cycleProgress = computed(() => {
    const c = this.activeCycle();
    const cur = this.nav()?.current ?? null;
    if (!c) return null;
    const start = +new Date(c.startDate);
    const end = +new Date(c.endDate);
    const total = Math.max(1, end - start);
    const elapsed = Math.min(total, Math.max(0, Date.now() - start));
    const liveReturn = c.startingNav > 0 && cur ? ((cur.nav - c.startingNav) / c.startingNav) * 100 : 0;
    return {
      cycleNumber: c.cycleNumber,
      pct: (elapsed / total) * 100,
      day: Math.min(Math.floor(elapsed / 86400000) + 1, 30),
      liveReturn,
    };
  });

  readonly lastPoint = computed(() => {
    const ps = this.pts();
    return ps.length ? ps[ps.length - 1] : null;
  });

  readonly lastLeft = computed(() => (this.lastPoint() ? this.xFullPct(this.pts().length - 1) : 0));
  readonly lastTop = computed(() => (this.lastPoint() ? this.topFullPct(this.lastPoint()!.nav) : 0));

  readonly tooltip = computed(() => {
    const i = this.hover();
    const ps = this.pts();
    if (i < 0 || i >= ps.length) return null;
    const p = ps[i];
    const prev = i > 0 ? ps[i - 1].nav : null;
    const delta = prev && prev > 0 ? ((p.nav - prev) / prev) * 100 : 0;
    return {
      left: Math.min(88, Math.max(12, this.xFullPct(i))),
      top: this.topFullPct(p.nav),
      nav: p.nav,
      delta,
      date: this.dateLabel(p.date),
    };
  });

  dayLabel(iso: string): string {
    return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  dateLabel(iso: string): string {
    return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  onMove(ev: MouseEvent): void {
    const el = ev.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const xPct = Math.min(100, Math.max(0, ((ev.clientX - rect.left) / rect.width) * 100));
    const n = this.pts().length;
    this.hover.set(n <= 1 ? 0 : Math.round((xPct / 100) * (n - 1)));
  }
}
