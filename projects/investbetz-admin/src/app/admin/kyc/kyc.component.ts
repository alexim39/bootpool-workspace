import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe, UpperCasePipe, DecimalPipe } from '@angular/common';
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
import { AdminKycStore, KycUser } from './stores/admin-kyc.store';

@Component({
  selector: 'app-kyc',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, UpperCasePipe, DecimalPipe, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatPaginatorModule],
  templateUrl: './kyc.component.html',
  styleUrls: ['./kyc.component.scss']
})
export class KycComponent implements OnInit {
  readonly store = inject(AdminKycStore);

  ngOnInit() {
    this.store.load();
  }

  kycTypeLabel(u: KycUser): string {
    return (u.kycType || '-').toUpperCase();
  }

  kycDateLabel(u: KycUser): string {
    if (!u.kycSubmittedAt) return '-';
    const d = new Date(u.kycSubmittedAt);
    return d.toLocaleDateString();
  }

  onPageChange(e: PageEvent) {
    this.store.onPageChange(e.pageIndex, e.pageSize);
  }
}
