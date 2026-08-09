import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService } from '../services/admin.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-admin-bet-manager',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule, MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule],
  templateUrl: './bet-manager.component.html',
  styleUrls: ['./bet-manager.component.scss'],
})
export class AdminBetManagerComponent implements OnInit {
  private admin = inject(AdminService);

  stats: any = null;
  pools: any[] = [];
  cycles: any[] = [];
  accounts: any[] = [];
  accountsTotal = 0;
  accountsPage = 1;
  deposits: any[] = [];
  depositTotal = 0;
  depositPage = 1;
  tierFilter = '';
  searchFilter = '';
  depositTierFilter = '';
  depositStatusFilter = '';
  selectedTier: string | null = null;
  tierDetail: any = null;
  accountDetail: any = null;
  selectedAccountId: string | null = null;

  loading = signal(false);
  settleLoading = signal('');
  reconcileLoading = signal(false);
  topUpTier = signal('');
  topUpAmount = signal(0);
  topUpLoading = signal(false);
  topUpResult = signal<{ success: boolean; message: string } | null>(null);
  seedLoading = signal(false);
  seedResult = signal<{ success: boolean; message: string } | null>(null);

  readonly tiers = [
    { key: 'academy', label: 'Academy', icon: '🏫', color: '#B0BEC5' },
    { key: 'goalkeeper', label: 'Goalkeeper', icon: '🧤', color: '#90CAF9' },
    { key: 'defender', label: 'Defender', icon: '🛡️', color: '#00E676' },
    { key: 'midfielder', label: 'Midfielder', icon: '⚡', color: '#E8B923' },
    { key: 'striker', label: 'Striker', icon: '🎯', color: '#FF5252' },
    { key: 'chairman', label: 'Chairman', icon: '🏛️', color: '#FFD700' },
  ];

  ngOnInit() {
    this.loadAll();
  }

  private loadAll() {
    this.loading.set(true);
    this.loadStats();
    this.loadPools();
    this.loadCycles();
    this.loadAccounts();
    this.loadDeposits();
  }

  loadStats() {
    this.admin.getBetManagerStats().subscribe(res => { if (res.success) this.stats = res.data; });
  }

  loadPools() {
    this.admin.getBetManagerPools().subscribe(res => { if (res.success) this.pools = res.data; });
  }

  loadCycles() {
    this.admin.getBetManagerCycles(this.tierFilter || undefined).subscribe(res => { if (res.success) this.cycles = res.data; });
  }

  loadAccounts() {
    this.admin.getBetManagerAccounts({ page: this.accountsPage, tier: this.tierFilter || undefined, search: this.searchFilter || undefined })
      .subscribe(res => { if (res.success) { this.accounts = res.data.accounts; this.accountsTotal = res.data.total; } });
  }

  loadDeposits() {
    this.admin.getBetManagerDeposits({ page: this.depositPage, tier: this.depositTierFilter || undefined, status: this.depositStatusFilter || undefined })
      .subscribe(res => { if (res.success) { this.deposits = res.data.deposits; this.depositTotal = res.data.total; } });
  }

  onFilterChange() {
    this.accountsPage = 1;
    this.loadAccounts();
    this.loadCycles();
  }

  onDepositFilterChange() {
    this.depositPage = 1;
    this.loadDeposits();
  }

  selectTier(tier: string) {
    this.selectedTier = tier;
    this.tierDetail = null;
    this.loading.set(true);
    this.admin.getBetManagerTierDetail(tier).pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => { if (res.success) this.tierDetail = res.data; });
  }

  backFromTier() {
    this.selectedTier = null;
    this.tierDetail = null;
  }

  settleCycle(tier: string) {
    this.settleLoading.set(tier);
    this.admin.settleBetManagerCycle(tier).pipe(finalize(() => this.settleLoading.set(''))).subscribe(res => {
      if (res.success) { this.loadCycles(); this.loadStats(); }
    });
  }

  reconcile() {
    this.reconcileLoading.set(true);
    this.admin.reconcileBetManager().pipe(finalize(() => this.reconcileLoading.set(false))).subscribe(res => {
      if (res.success) { this.loadStats(); this.loadPools(); }
    });
  }

  openTopUp(tier: string) {
    this.topUpTier.set(tier);
    this.topUpAmount.set(0);
    this.topUpResult.set(null);
  }

  closeTopUp() {
    this.topUpTier.set('');
    this.topUpAmount.set(0);
    this.topUpResult.set(null);
  }

  submitTopUp() {
    const tier = this.topUpTier();
    const amount = this.topUpAmount();
    if (!tier || !amount || amount <= 0) return;
    this.topUpLoading.set(true);
    this.topUpResult.set(null);
    this.admin.topUpPool(tier, amount).pipe(finalize(() => this.topUpLoading.set(false))).subscribe({
      next: res => {
        this.topUpResult.set({ success: true, message: res.message });
        this.loadPools();
        this.loadStats();
        setTimeout(() => this.closeTopUp(), 2000);
      },
      error: err => {
        this.topUpResult.set({ success: false, message: err.error?.message || 'Top-up failed' });
      }
    });
  }

  seedReserve() {
    this.seedLoading.set(true);
    this.seedResult.set(null);
    this.admin.seedBetManagerReserve().pipe(finalize(() => this.seedLoading.set(false))).subscribe({
      next: res => {
        this.seedResult.set({ success: res.success, message: res.message });
        this.loadStats();
      },
      error: err => {
        this.seedResult.set({ success: false, message: err.error?.message || 'Seed failed' });
      }
    });
  }

  reserveHealth(): 'ok' | 'low' | 'empty' {
    const r = this.stats?.guaranteeReserve || 0;
    if (r <= 0) return 'empty';
    if (r < 1000000) return 'low';
    return 'ok';
  }

  viewAccount(id: string) {
    this.selectedAccountId = id;
    this.accountDetail = null;
    this.admin.getBetManagerAccountDetail(id).subscribe(res => {
      if (res.success) this.accountDetail = res.data;
    });
  }

  closeAccountDetail() {
    this.selectedAccountId = null;
    this.accountDetail = null;
  }

  get paginatedCycles() { return this.cycles; }

  getSelectedTierInfo() {
    return this.tiers.find(t => t.key === this.selectedTier) || this.tiers[0];
  }

  getPoolBalance(tierKey: string): number {
    return this.pools.find(p => p.tier === tierKey)?.balance || 0;
  }

  getTierIcon(tierKey: string): string {
    return this.tiers.find(t => t.key === tierKey)?.icon || '';
  }

  getTierStyle(tierKey: string): { background: string; color: string } {
    const t = this.tiers.find(t => t.key === tierKey);
    if (!t) return { background: 'rgba(255,255,255,0.1)', color: '#888' };
    return { background: t.color + '26', color: t.color };
  }
}
