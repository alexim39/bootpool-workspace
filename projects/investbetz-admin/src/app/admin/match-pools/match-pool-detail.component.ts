import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { AdminMatchPoolsStore } from './stores/admin-match-pools.store';
import { PoolReport } from '../services';

@Component({
  selector: 'app-admin-match-pool-detail',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule],
  templateUrl: './match-pool-detail.component.html',
  styleUrls: ['./match-pool-detail.component.scss']
})
export class MatchPoolDetailComponent implements OnInit {
  readonly store = inject(AdminMatchPoolsStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('stakersSection') stakersSection?: ElementRef<HTMLElement>;

  private searchTimer: any;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) this.store.openDetail(id);
    });
  }

  goBack() {
    this.router.navigate(['/admin/match-pools']);
  }

  statusColor(s: string): string {
    const map: Record<string, string> = { open: '#00E676', staking_closed: '#E8B923', settled: '#2196f3', cancelled: '#888' };
    return map[s] || '#555';
  }

  statusColorLite(s: string): string {
    return this.statusColor(s) + '24';
  }

  openStakers(marketId: string) {
    this.store.openStakers(marketId);
    setTimeout(() => this.stakersSection?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  marketLabel(marketId: string): string {
    const d = this.store.detail();
    if (!d) return marketId;
    return d.pool.markets.find(m => m.marketId === marketId)?.label || marketId;
  }

  clearStakesFilters() {
    clearTimeout(this.searchTimer);
    this.store.stakesMarket.set('');
    this.store.stakesStatus.set('');
    this.store.stakesSearch.set('');
    this.store.stakesFrom.set('');
    this.store.stakesTo.set('');
    this.store.loadStakes({ page: 1 });
  }

  stakeStatusLabel(s: string): string {
    const map: Record<string, string> = {
      confirmed: 'Confirmed', won: 'Won', lost: 'Lost', cancelled_refunded: 'Refunded'
    };
    return map[s] || s;
  }

  stakeStatusColor(s: string): string {
    const map: Record<string, string> = {
      confirmed: '#00E676', won: '#2196f3', lost: '#FF8A80', cancelled_refunded: '#888'
    };
    return map[s] || '#555';
  }

  onStakesSearchChange() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.store.loadStakes({ page: 1, search: this.store.stakesSearch() }), 300);
  }

  clearStakesSearch() {
    clearTimeout(this.searchTimer);
    this.store.stakesSearch.set('');
    this.store.loadStakes({ page: 1, search: '' });
  }

  onStakesMarket(marketId: string) { this.store.stakesMarket.set(marketId); this.store.loadStakes({ page: 1 }); }
  onStakesStatus(status: string) { this.store.stakesStatus.set(status); this.store.loadStakes({ page: 1 }); }
  onStakesDate() { this.store.loadStakes({ page: 1 }); }

  setStakesPage(p: number) {
    const pages = Math.max(1, Math.ceil(this.store.stakesTotal() / this.store.stakesLimit()));
    if (p < 1 || p > pages) return;
    this.store.loadStakes({ page: p });
  }

  onStakesLimit() { this.store.loadStakes({ page: 1 }); }

  toggleStakesSort(field: 'createdAt' | 'amount' | 'status') {
    const s = this.store.stakesSort();
    if (s === field) {
      this.store.stakesOrder.set(this.store.stakesOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.store.stakesSort.set(field);
      this.store.stakesOrder.set(field === 'status' ? 'asc' : 'desc');
    }
    this.store.loadStakes({ page: 1 });
  }

  stakesPages(): number {
    const limit = this.store.stakesLimit();
    return Math.max(1, Math.ceil(this.store.stakesTotal() / (limit || 1)));
  }

  stakesPagesArray(): number[] {
    const total = this.stakesPages();
    const current = this.store.stakesPage();
    const out: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }

  stakesRangeLabel(): string {
    const total = this.store.stakesTotal();
    if (total === 0) return '0';
    const start = (this.store.stakesPage() - 1) * this.store.stakesLimit() + 1;
    const end = Math.min(this.store.stakesPage() * this.store.stakesLimit(), total);
    return `${start}–${end}`;
  }

  initials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(w => w[0]?.toUpperCase() || '').join('') || '?';
  }

  avatarColor(name?: string): string {
    const palette = ['#00E676', '#2196f3', '#FFD54F', '#FF8A80', '#B388FF', '#26C6DA'];
    if (!name) return palette[0];
    const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
    return palette[h % palette.length];
  }

  winningMarketInfo(rm: PoolReport): { label: string; winners: number } | null {
    const mb = rm.marketBreakdown.find(m => m.marketId === rm.winningMarketId);
    return mb ? { label: mb.label, winners: mb.winners } : null;
  }
}
