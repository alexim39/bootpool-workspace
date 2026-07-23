import { Component, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminMatchPoolsStore } from './stores/admin-match-pools.store';

@Component({
  selector: 'app-admin-match-pools',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './match-pools.component.html',
  styleUrls: ['./match-pools.component.scss']
})
export class AdminMatchPoolsComponent {
  readonly store = inject(AdminMatchPoolsStore);

  formTitle = '';
  formStakingCloses = '';
  formMinStake = 100;
  formMaxStake = 100000;
  formMarkets: { label: string }[] = [{ label: '' }, { label: '' }, { label: '' }];

  switchViewCreate() {
    this.formTitle = '';
    this.formStakingCloses = '';
    this.formMinStake = 100;
    this.formMaxStake = 100000;
    this.formMarkets = [{ label: '' }, { label: '' }, { label: '' }];
    this.store.error.set('');
    this.store.switchView('create');
  }

  addMarket() { this.formMarkets.push({ label: '' }); }

  removeMarket(i: number) { if (this.formMarkets.length > 2) this.formMarkets.splice(i, 1); }

  createPool() {
    this.store.createPool({
      eventTitle: this.formTitle,
      stakingClosesAt: this.formStakingCloses,
      minStake: this.formMinStake,
      maxStake: this.formMaxStake,
      markets: this.formMarkets
    });
  }

  statusColor(s: string): string {
    const map: Record<string, string> = { open: '#00E676', staking_closed: '#E8B923', settled: '#2196f3', cancelled: '#888' };
    return map[s] || '#555';
  }
}
