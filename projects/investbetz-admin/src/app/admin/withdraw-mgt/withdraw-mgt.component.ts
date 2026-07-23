import { Component, OnInit, inject } from '@angular/core';
import { NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminWithdrawal } from '../services';
import { AdminWithdrawMgtStore } from './stores/admin-withdraw-mgt.store';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-withdraw-mgt',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, FormsModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatTooltipModule],
  templateUrl: './withdraw-mgt.component.html',
  styleUrls: ['./withdraw-mgt.component.scss']
})
export class WithdrawMgtComponent implements OnInit {
  readonly store = inject(AdminWithdrawMgtStore);

  ngOnInit() { this.store.load(); }

  statusColor(s: string): string {
    return s === 'completed' ? '#00E676' : s === 'pending' ? '#E8B923' : s === 'processing' ? '#90CAF9' : s === 'failed' ? '#f44336' : s === 'cancelled' ? '#666' : '#555';
  }
}
