import { Component, OnInit, inject, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AdminUser } from '../services';
import { Router } from '@angular/router';
import { AdminUsersStore } from './stores/admin-users.store';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, DecimalPipe,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatCardModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  readonly store = inject(AdminUsersStore);
  private router = inject(Router);
  readonly skeletonRows = Array.from({ length: 8 }, (_, i) => i);

  ngOnInit() {
    this.store.load();
    this.store.loadGrowth(this.store.growthPeriod());
  }

  readonly growthMax = computed(() => {
    const series = this.store.growth()?.series ?? [];
    return Math.max(1, ...series.map(s => s.count));
  });

  growthBarHeight(count: number): number {
    return Math.max(2, (count / this.growthMax()) * 100);
  }

  showGrowthBarLabel(index: number): boolean {
    const period = this.store.growthPeriod();
    if (period === 'day') return index % 5 === 0;
    if (period === 'week') return index % 3 === 0;
    return true;
  }

  setGrowthPeriod(period: 'day' | 'week' | 'month' | 'year') {
    this.store.setGrowthPeriod(period);
  }

  growthDelta(): string {
    const pct = this.store.growth()?.changePct;
    if (pct === null || pct === undefined) return 'new window';
    return `${pct >= 0 ? '+' : ''}${pct}% vs prev. ${this.store.growth()?.periodUnit}s`;
  }

  growthDeltaUp(): boolean {
    const pct = this.store.growth()?.changePct;
    return pct !== null && pct !== undefined && pct >= 0;
  }

  formatPeak(peak: { label: string; count: number } | null): string {
    if (!peak) return '—';
    return `${peak.label} · ${peak.count.toLocaleString()}`;
  }

  viewUser(u: AdminUser) {
    this.router.navigate(['/admin/users', u._id || u.id]);
  }

  formatDate(d: string | undefined): string {
    if (!d) return '-';
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000 && date.getDate() === now.getDate()) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diff < 172800000 && date.getDate() === now.getDate() - 1) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatWallet(b: number | undefined): string {
    if (b == null) return '-';
    return '₦' + b.toLocaleString();
  }

  goToPage(page: number | string) {
    if (typeof page === 'string') return;
    this.store.setPage(page);
  }

  goToPageInput(input: HTMLInputElement) {
    const val = parseInt(input.value, 10);
    if (val > 0 && val <= this.store.totalPages()) {
      this.store.setPage(val);
    }
    input.value = '';
  }
}
