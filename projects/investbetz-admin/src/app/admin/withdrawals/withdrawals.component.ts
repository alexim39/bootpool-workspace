import { Component, OnInit, inject } from '@angular/core';
import { NgIf, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { AdminWithdrawal } from '../services';
import { AdminWithdrawalsStore } from './stores/admin-withdrawals.store';
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

@Component({
  selector: 'app-withdrawals',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, SlicePipe, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatPaginatorModule],
  templateUrl: './withdrawals.component.html',
  styleUrls: ['./withdrawals.component.scss']
})
export class WithdrawalsComponent implements OnInit {
  readonly store = inject(AdminWithdrawalsStore);

  ngOnInit() { this.store.load(); }

  statusColor(s: string): string {
    const map: Record<string, string> = { pending: '#E8B923', processing: '#2196f3', completed: '#00E676', failed: '#f44336' };
    return map[s] || '#555';
  }
}
