import { Injectable, inject, signal } from '@angular/core';
import { AdminService, BIReport } from '../../services';

@Injectable({ providedIn: 'root' })
export class AdminBiReportsStore {
  private admin = inject(AdminService);

  readonly report = signal<BIReport | null>(null);
  readonly loading = signal(false);
  readonly selectedDays = signal(30);

  readonly sportColumns = ['sport', 'stakes', 'revenue', 'payouts', 'profit'];
  readonly leagueColumns = ['league', 'stakes', 'revenue', 'profit'];
  readonly podColumns = ['title', 'sport', 'stakes', 'volume', 'profit'];
  readonly userColumns = ['phone', 'staked', 'won', 'count'];

  load() {
    this.loading.set(true);
    this.admin.getBIReport(this.selectedDays()).subscribe(res => {
      if (res.success) this.report.set(res.data);
      this.loading.set(false);
    });
  }
}
