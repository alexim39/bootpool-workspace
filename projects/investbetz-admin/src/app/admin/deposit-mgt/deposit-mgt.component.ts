import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminTransaction } from '../services';
import { AdminDepositMgtStore } from './stores/admin-deposit-mgt.store';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-deposit-mgt',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, FormsModule,
    MatCardModule, MatTableModule, MatSortModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule,
    MatDatepickerModule, MatNativeDateModule, MatPaginatorModule],
  templateUrl: './deposit-mgt.component.html',
  styleUrls: ['./deposit-mgt.component.scss']
})
export class DepositMgtComponent implements OnInit, OnDestroy {
  readonly store = inject(AdminDepositMgtStore);

  ngOnInit() { this.store.load(); }
  ngOnDestroy() { this.store.destroy(); }

  get sortDir(): SortDirection {
    return this.store.sortOrder() as SortDirection;
  }

  onSortChange(sort: Sort) {
    this.store.setSort(sort);
  }

  onPageChange(e: PageEvent) {
    this.store.page.set(e.pageIndex + 1);
    this.store.limit.set(e.pageSize);
    this.store.load();
  }

  quickDate(preset: string) {
    const now = new Date();
    let from: Date;
    switch (preset) {
      case 'today': from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case '7d': from = new Date(now.getTime() - 7 * 86400000); break;
      case '30d': from = new Date(now.getTime() - 30 * 86400000); break;
      case 'month': from = new Date(now.getFullYear(), now.getMonth(), 1); break;
      default: return;
    }
    this.store.setDateRange(from.toISOString(), now.toISOString());
  }

  statusColor(s: string): string {
    return s === 'completed' ? '#00E676' : s === 'pending' ? '#E8B923' : s === 'processing' ? '#90CAF9' : s === 'failed' ? '#f44336' : s === 'cancelled' ? '#666' : '#555';
  }
}
