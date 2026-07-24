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

  readonly tiers = [
    { key: 'defender', label: 'Defender', icon: '🛡️', color: '#00E676' },
    { key: 'midfielder', label: 'Midfielder', icon: '⚡', color: '#E8B923' },
    { key: 'striker', label: 'Striker', icon: '🎯', color: '#FF5252' },
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
}
