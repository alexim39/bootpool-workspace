import { Component, inject, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { DeviceService } from '../../core/services';
import { AppNavComponent } from '../../core/components';
import { MobileNavComponent } from '../../core/components';
import { MatchPoolsStore } from './stores/match-pools.store';

@Component({
  selector: 'app-match-pools',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, PercentPipe,
    MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule,
    MatTabsModule, MatChipsModule, MatTableModule, AppNavComponent, MobileNavComponent],
  templateUrl: './match-pools.component.html',
  styleUrls: ['./match-pools.component.scss']
})
export class MatchPoolsComponent implements OnInit {
  device = inject(DeviceService);
  readonly store = inject(MatchPoolsStore);

  ngOnInit() {
    this.store.init();
  }
}
