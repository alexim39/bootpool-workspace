import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgIf, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminStake } from '../services';
import { AdminStakesStore } from './stores/admin-stakes.store';
import { StakeDetailDialogComponent } from './stake-detail-dialog.component';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { takeUntil, Subject } from 'rxjs';

@Component({
  selector: 'app-stakes',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, SlicePipe, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatPaginatorModule,
    MatDialogModule],
  templateUrl: './stakes.component.html',
  styleUrls: ['./stakes.component.scss']
})
export class StakesComponent implements OnInit, OnDestroy {
  readonly store = inject(AdminStakesStore);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();
  readonly columns = ['id', 'type', 'user', 'amount', 'status', 'createdAt', 'actions'];
  protected Math = Math;

  ngOnInit() {
    this.store.loadStakes();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.store.destroy();
  }

  openDetail(s: AdminStake) {
    const id = s._id || s.id;
    if (!id) return;
    this.store.admin.getStake(id).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.success) {
        this.dialog.open(StakeDetailDialogComponent, {
          data: res.data,
          panelClass: 'stake-dialog-panel',
          backdropClass: 'stake-dialog-backdrop',
          maxWidth: '92vw',
          disableClose: false,
          autoFocus: false
        });
      }
    });
  }

  visiblePages(): number[] {
    const total = this.store.totalPages();
    const current = this.store.page();
    const delta = 2;
    const range: number[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) range.push(i);
      return range;
    }
    range.push(1);
    if (current - delta > 2) range.push(-1);
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }
    if (current + delta < total - 1) range.push(-2);
    range.push(total);
    return range;
  }

  clampPage(v: number): number {
    return Math.max(1, Math.min(v, this.store.totalPages()));
  }

  goToPage(page: number) {
    if (page < 1 || page > this.store.totalPages()) return;
    this.store.page.set(page);
    this.store.loadStakes();
  }

  statusColor(s: string): string {
    const map: Record<string, string> = { pending: '#E8B923', confirmed: '#00E676', active: '#E8B923', won: '#00E676', lost: '#888', void: '#666', cashed_out: '#2196f3', cancelled: '#f44336', refunded: '#888' };
    return map[s] || '#555';
  }
}
