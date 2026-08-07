import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DeviceService, OraRecordService, OraRecord } from '../../core/services';
import { AppNavComponent, MobileNavComponent } from '../../core/components';

@Component({
  selector: 'app-ora-record',
  standalone: true,
  imports: [RouterModule, CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, AppNavComponent, MobileNavComponent],
  templateUrl: './ora-record.component.html',
  styleUrls: ['./ora-record.component.scss']
})
export class OraRecordComponent implements OnInit {
  device = inject(DeviceService);
  isMobileView = computed(() => this.device.isMobile() || this.device.isTablet());
  private oraRecord = inject(OraRecordService);

  record = signal<OraRecord | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  refreshing = signal(false);
  league = signal('');
  limit = signal(20);
  limitOptions = [10, 20, 50];

  skeletonRows = Array.from({ length: 6 }, (_, i) => i);

  leagues = computed(() => {
    const r = this.record();
    if (!r) return [];
    return [...new Set(r.byLeague.map(l => l.league))].sort((a, b) => a.localeCompare(b));
  });

  ngOnInit() {
    this.load();
  }

  load(refresh = false) {
    this.loading.set(true);
    this.error.set(null);
    if (refresh) this.refreshing.set(true);
    this.oraRecord.getRecord(this.league(), this.limit(), refresh).subscribe({
      next: (res) => {
        if (res.success) this.record.set(res.data);
        else this.error.set('Failed to load Ora record');
        this.loading.set(false);
        this.refreshing.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load Ora record');
        this.loading.set(false);
        this.refreshing.set(false);
      }
    });
  }

  setLeague(league: string) {
    this.league.set(league);
    this.load();
  }

  setLimit(limit: number) {
    this.limit.set(limit);
    this.load();
  }

  refresh() {
    this.load(true);
  }

  formatDuration(ms: number | null): string {
    if (ms === null) return '—';
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
    return `${Math.floor(ms / 3_600_000)}h ${Math.round((ms % 3_600_000) / 60_000)}m`;
  }

  formatNumber(n: number | null): string {
    if (n === null) return '—';
    return n.toLocaleString('en-US');
  }

  formatPercent(n: number | null): string {
    if (n === null) return '—';
    return `${Math.round(n)}%`;
  }

  formatRatio(n: number | null): string {
    if (n === null) return '—';
    return `${Math.round(n * 100)}%`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-NG', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  tierColor(sample: 'sufficient' | 'low'): string {
    return sample === 'sufficient' ? '#00E676' : '#F5B301';
  }
}
