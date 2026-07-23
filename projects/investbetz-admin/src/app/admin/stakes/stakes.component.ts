import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgIf, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { AdminStake } from '../services';
import { AdminStakesStore } from './stores/admin-stakes.store';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stakes',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, SlicePipe, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatPaginatorModule],
  templateUrl: './stakes.component.html',
  styleUrls: ['./stakes.component.scss']
})
export class StakesComponent implements OnInit, OnDestroy {
  readonly store = inject(AdminStakesStore);
  readonly columns = ['id', 'user', 'amount', 'status', 'createdAt', 'actions'];

  ngOnInit() {
    this.store.loadStakes();
  }

  ngOnDestroy() {
    this.store.destroy();
  }

  onPageChange(e: PageEvent) {
    this.store.onPageChange(e);
  }

  private stakeId(s: AdminStake): string {
    return s._id || s.id;
  }

  canSettle(s: AdminStake): boolean {
    return ['pending', 'confirmed', 'active'].includes(s.status);
  }

  statusColor(s: string): string {
    const map: Record<string, string> = { pending: '#E8B923', confirmed: '#00E676', active: '#E8B923', won: '#00E676', lost: '#888', void: '#666', cashed_out: '#2196f3', cancelled: '#f44336', refunded: '#888' };
    return map[s] || '#555';
  }
}
