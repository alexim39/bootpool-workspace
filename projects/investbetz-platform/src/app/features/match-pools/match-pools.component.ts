import { Component, inject, OnInit, signal, effect, DestroyRef } from '@angular/core';
import { DatePipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DeviceService } from '../../core/services';
import { AppNavComponent } from '../../core/components';
import { MobileNavComponent } from '../../core/components';
import { MatchPoolsStore } from './stores/match-pools.store';

@Component({
  selector: 'app-match-pools',
  standalone: true,
  imports: [DatePipe, FormsModule, PercentPipe,
    MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule,
    MatTabsModule, MatChipsModule, MatTableModule, MatPaginatorModule,
    AppNavComponent, MobileNavComponent],
  templateUrl: './match-pools.component.html',
  styleUrls: ['./match-pools.component.scss']
})
export class MatchPoolsComponent implements OnInit {
  device = inject(DeviceService);
  readonly store = inject(MatchPoolsStore);
  private destroyRef = inject(DestroyRef);

  readonly searchQuery = signal('');
  readonly statusFilter = signal<string>('all');
  private searchSubject = new Subject<string>();

  readonly pageSizeOptions = [10, 25, 50];
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);

  prevPage() {
    if (this.pageIndex() > 0) {
      this.pageIndex.set(this.pageIndex() - 1);
      this.store.fetchPoolsPaginated(this.pageIndex() + 1, this.pageSize(), this.searchQuery(), this.statusFilter());
    }
  }

  nextPage() {
    if (this.pageIndex() + 1 < this.store.totalPages()) {
      this.pageIndex.set(this.pageIndex() + 1);
      this.store.fetchPoolsPaginated(this.pageIndex() + 1, this.pageSize(), this.searchQuery(), this.statusFilter());
    }
  }

  constructor() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.pageIndex.set(0);
      this.store.fetchPoolsPaginated(this.pageIndex() + 1, this.pageSize(), query);
    });
  }

  ngOnInit() {
    this.store.initPaginated(this.pageIndex() + 1, this.pageSize());
  }

  onSearchInput(value: string) {
    this.searchSubject.next(value);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.store.fetchPoolsPaginated(event.pageIndex + 1, event.pageSize, this.searchQuery());
  }

  onStatusFilterChange(status: string) {
    this.statusFilter.set(status);
    this.pageIndex.set(0);
    this.store.fetchPoolsPaginated(1, this.pageSize(), this.searchQuery(), status);
  }

  resetFilters() {
    this.searchSubject.next('');
    this.statusFilter.set('all');
    this.pageIndex.set(0);
    this.store.fetchPoolsPaginated(1, this.pageSize());
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount);
  }
}
