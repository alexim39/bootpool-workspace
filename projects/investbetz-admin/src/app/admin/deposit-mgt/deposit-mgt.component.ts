import { Component, OnInit, inject } from '@angular/core';
import { NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminTransaction } from '../services';
import { AdminDepositMgtStore } from './stores/admin-deposit-mgt.store';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-deposit-mgt',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, FormsModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatTooltipModule],
  templateUrl: './deposit-mgt.component.html',
  styleUrls: ['./deposit-mgt.component.scss']
})
export class DepositMgtComponent implements OnInit {
  readonly store = inject(AdminDepositMgtStore);

  ngOnInit() { this.store.load(); }

  statusColor(s: string): string {
    return s === 'completed' ? '#00E676' : s === 'pending' ? '#E8B923' : s === 'processing' ? '#90CAF9' : s === 'failed' ? '#f44336' : s === 'cancelled' ? '#666' : '#555';
  }
}
