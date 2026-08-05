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

  skeletonRows = Array.from({ length: 6 }, (_, i) => i);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.oraRecord.getRecord().subscribe({
      next: (res) => {
        if (res.success) this.record.set(res.data);
        else this.error.set('Failed to load Ora record');
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load Ora record');
        this.loading.set(false);
      }
    });
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

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-NG', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  tierColor(sample: 'sufficient' | 'low'): string {
    return sample === 'sufficient' ? '#00E676' : '#F5B301';
  }
}
