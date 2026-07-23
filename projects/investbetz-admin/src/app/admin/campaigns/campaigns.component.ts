import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { AdminCampaignsStore } from './stores/admin-campaigns.store';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule,
    MatCardModule, MatTableModule, MatIconModule,
    MatButtonModule, MatFormFieldModule, MatSelectModule, MatTooltipModule],
  templateUrl: './campaigns.component.html',
  styleUrls: ['./campaigns.component.scss']
})
export class CampaignsComponent implements OnInit {
  readonly store = inject(AdminCampaignsStore);

  ngOnInit() { this.store.loadSegments(); }
}
