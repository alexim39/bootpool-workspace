import { Injectable, inject, signal } from '@angular/core';
import { AdminMatchPoolService, AdminMatchPool, AdminPoolDetail, PoolReport, PoolReportsAgg } from '../../services';

export type ViewMode = 'list' | 'create' | 'detail' | 'reports';

export interface SettlePreview {
  totalPool: number;
  platformFee: number;
  distributable: number;
  winningTotal: number;
  winnerCount: number;
}

@Injectable({ providedIn: 'root' })
export class AdminMatchPoolsStore {
  private service = inject(AdminMatchPoolService);

  readonly view = signal<ViewMode>('list');
  readonly loading = signal(false);
  readonly pools = signal<AdminMatchPool[]>([]);
  readonly statusFilter = signal('');
  readonly saving = signal(false);
  readonly settling = signal(false);
  readonly error = signal('');

  readonly detail = signal<AdminPoolDetail | null>(null);
  readonly selectedMarketId = signal('');
  readonly settlePreview = signal<SettlePreview | null>(null);

  readonly reportsData = signal<PoolReportsAgg | null>(null);
  readonly reportModal = signal<PoolReport | null>(null);

  loadList() {
    this.loading.set(true);
    this.service.list({ status: this.statusFilter() || undefined }).subscribe({
      next: (res) => { if (res.success) this.pools.set(res.data.items); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  switchView(v: ViewMode) {
    this.view.set(v);
    if (v === 'list') this.loadList();
    if (v === 'reports') this.loadReports();
  }

  createPool(data: { eventTitle: string; stakingClosesAt: string; minStake: number; maxStake: number; markets: { label: string }[] }) {
    if (!data.eventTitle || !data.stakingClosesAt) {
      this.error.set('Event title and staking close time required');
      return;
    }
    const markets = data.markets.filter(m => m.label.trim()).map((m, i) => ({
      marketId: m.label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      label: m.label.trim()
    }));
    if (markets.length < 2) { this.error.set('At least 2 markets required'); return; }

    this.saving.set(true);
    this.error.set('');
    this.service.create({
      eventTitle: data.eventTitle,
      markets,
      stakingClosesAt: new Date(data.stakingClosesAt).toISOString(),
      minStake: data.minStake,
      maxStake: data.maxStake
    }).subscribe({
      next: () => { this.saving.set(false); this.switchView('list'); },
      error: (err) => { this.saving.set(false); this.error.set(err.error?.message || 'Failed to create'); }
    });
  }

  openDetail(id: string) {
    this.loading.set(true);
    this.view.set('detail');
    this.service.getDetail(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.detail.set(res.data);
          this.selectedMarketId.set('');
          this.settlePreview.set(null);
        }
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.view.set('list'); }
    });
  }

  closeStaking(id: string) {
    this.service.closeStaking(id).subscribe({
      next: () => this.openDetail(id),
      error: (err) => alert(err.error?.message || 'Failed')
    });
  }

  settlePool(id: string) {
    if (!this.selectedMarketId()) return;
    const d = this.detail();
    if (!d) return;
    const market = d.pool.markets.find(m => m.marketId === this.selectedMarketId());
    if (!market) return;

    const totalPool = d.pool.totalPool || d.marketBreakdown.reduce((s, mb) => s + mb.totalStaked, 0);
    const platformFee = Math.floor(totalPool * 0.15);
    const distributable = totalPool - platformFee;
    const winningStakes = d.marketBreakdown.find(mb => mb.marketId === this.selectedMarketId());
    const winningTotal = winningStakes?.totalStaked || 0;

    this.settlePreview.set({ totalPool, platformFee, distributable, winningTotal, winnerCount: winningStakes?.stakerCount || 0 });

    this.settling.set(true);
    this.service.settle(id, this.selectedMarketId()).subscribe({
      next: () => { this.settling.set(false); this.openDetail(id); },
      error: (err) => { this.settling.set(false); alert(err.error?.message || 'Settlement failed'); }
    });
  }

  cancelPool(id: string) {
    this.service.cancel(id).subscribe({
      next: () => this.openDetail(id),
      error: (err) => alert(err.error?.message || 'Failed')
    });
  }

  showReport(id: string) {
    this.service.getReport(id).subscribe(res => {
      if (res.success) this.reportModal.set(res.data);
    });
  }

  loadReports() {
    this.loading.set(true);
    this.service.getReports().subscribe({
      next: (res) => { if (res.success) this.reportsData.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
