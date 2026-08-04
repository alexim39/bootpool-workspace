import { Injectable, inject, signal } from '@angular/core';
import { AdminService, AbTestExperiment, AbTestSummary } from '../../services';

@Injectable({ providedIn: 'root' })
export class AdminAbtestsStore {
  private admin = inject(AdminService);

  readonly experiments = signal<AbTestExperiment[]>([]);
  readonly summary = signal<AbTestSummary | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly togglingKey = signal<string | null>(null);
  readonly analyzingKey = signal<string | null>(null);

  load() {
    this.loading.set(true);
    this.admin.listExperiments().subscribe({
      next: res => {
        if (res.success) this.experiments.set(res.experiments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(key: string, description: string, enabled: boolean, controlShare: number) {
    if (!key.trim() || this.saving()) return;
    this.saving.set(true);
    this.admin.upsertExperiment({ key: key.trim(), description: description.trim() || undefined, enabled, controlShare }).subscribe({
      next: () => { this.saving.set(false); this.load(); },
      error: () => { this.saving.set(false); },
    });
  }

  toggle(key: string, enabled: boolean) {
    if (this.togglingKey()) return;
    this.togglingKey.set(key);
    this.admin.toggleExperiment(key, enabled).subscribe({
      next: () => { this.togglingKey.set(null); this.load(); },
      error: () => { this.togglingKey.set(null); },
    });
  }

  analyze(key: string) {
    this.analyzingKey.set(key);
    this.admin.getExperimentSummary(key).subscribe({
      next: res => {
        this.summary.set({ experiment: res.experiment, events: res.events, users: res.users });
        this.analyzingKey.set(null);
      },
      error: () => { this.analyzingKey.set(null); },
    });
  }

  closeSummary() {
    this.summary.set(null);
  }
}
