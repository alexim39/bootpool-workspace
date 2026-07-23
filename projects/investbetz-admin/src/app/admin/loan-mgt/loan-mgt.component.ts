import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminLoan } from '../services';
import { AdminLoanMgtStore } from './stores/admin-loan-mgt.store';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-loan-mgt',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, FormsModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatTooltipModule],
  templateUrl: './loan-mgt.component.html',
  styleUrls: ['./loan-mgt.component.scss']
})
export class LoanMgtComponent implements OnInit {
  readonly store = inject(AdminLoanMgtStore);
  readonly columns = ['user', 'amount', 'purpose', 'interest', 'status', 'date', 'due', 'actions'];
  newLoan = { userId: '', amount: 0, purpose: '', interestRate: 0, dueDate: '' };

  ngOnInit() {
    this.store.loadLoans();
  }

  toggleDetail(l: AdminLoan) {
    if (this.store.detailId() === l._id) {
      this.store.detail.set(null);
      this.store.detailId.set(null);
      this.store.showReject.set(false);
    } else {
      this.store.detail.set(l);
      this.store.detailId.set(l._id);
      this.store.showReject.set(false);
      this.store.rejectReason.set('');
    }
  }

  statusColor(s: string): string {
    return s === 'repaid' ? '#00E676' : s === 'approved' ? '#90CAF9' : s === 'active' ? '#CE93D8' : s === 'pending' ? '#E8B923' : s === 'rejected' ? '#666' : s === 'defaulted' ? '#f44336' : '#555';
  }
}
