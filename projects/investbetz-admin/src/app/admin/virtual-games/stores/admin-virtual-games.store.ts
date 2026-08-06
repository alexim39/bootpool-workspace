import { Injectable, inject, signal } from '@angular/core';
import { AdminVirtualGamesService, AdminVirtualGamesAgg } from '../../services';

@Injectable({ providedIn: 'root' })
export class AdminVirtualGamesStore {
  private service = inject(AdminVirtualGamesService);

  readonly loading = signal(false);
  readonly data = signal<AdminVirtualGamesAgg | null>(null);
  readonly error = signal('');
  readonly from = signal('');
  readonly to = signal('');

  load() {
    this.loading.set(true);
    this.error.set('');
    this.service.getSummary({
      from: this.from() || undefined,
      to: this.to() || undefined,
    }).subscribe({
      next: (res) => {
        if (res.success) this.data.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to load summary');
      }
    });
  }

  applyRange() {
    if (this.from() && this.to() && this.from() > this.to()) {
      this.error.set('From date cannot be after To date');
      return;
    }
    this.load();
  }

  clearRange() {
    this.from.set('');
    this.to.set('');
    this.load();
  }
}
