import { Component, OnInit, inject } from '@angular/core';
import { NgIf, DecimalPipe, SlicePipe } from '@angular/common';
import { AdminBiReportsStore } from './stores/admin-bi-reports.store';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bi-reports',
  standalone: true,
  imports: [NgIf, DecimalPipe, SlicePipe, FormsModule,
    MatCardModule, MatTableModule, MatIconModule, MatButtonModule],
  templateUrl: './bi-reports.component.html',
  styleUrls: ['./bi-reports.component.scss']
})
export class BIReportsComponent implements OnInit {
  protected Math = Math;
  readonly store = inject(AdminBiReportsStore);

  ngOnInit() { this.store.load(); }
}
