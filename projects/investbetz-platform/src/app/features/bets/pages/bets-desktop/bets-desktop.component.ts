import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Stake } from '../../../../core/services';
import { BetCardComponent } from '../../components/bet-card/bet-card.component';
import { CashoutModalComponent } from '../../../home/components/cashout-modal/cashout-modal.component';
import { AppNavComponent } from '../../../../core/components';
import { BetsStore } from '../../stores/bets.store';

@Component({
  selector: 'app-bets-desktop',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTabsModule, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule,
    MatBadgeModule, MatChipsModule, MatTooltipModule, MatSnackBarModule, BetCardComponent, CashoutModalComponent, AppNavComponent
  ],
    templateUrl: './bets-desktop.component.html',
  styleUrls: ['./bets-desktop.component.scss']
})
export class BetsDesktopComponent implements OnInit {
  readonly store = inject(BetsStore);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['date', 'match', 'odds', 'stake', 'payout', 'status', 'result', 'actions'];

  ngOnInit() {
    this.store.init();
  }

  viewStakeDetails(stake: Stake) {
    this.snackBar.open('Stake details', 'OK', { duration: 2000 });
  }

  getStatusClass(status: Stake['status']): string {
    const classes: Record<Stake['status'], string> = {
      pending: 'chip-gold', confirmed: 'chip-gold', won: 'chip-emerald',
      lost: 'chip-gray', void: 'chip-gray', refunded: 'chip-gray', cancelled: 'chip-gray', cashed_out: 'chip-blue'
    };
    return classes[status] || 'chip-gray';
  }

  getStatusIcon(status: Stake['status']): string {
    const icons: Record<Stake['status'], string> = {
      pending: 'schedule', confirmed: 'check_circle', won: 'emoji_events',
      lost: 'autorenew', void: 'remove_circle', refunded: 'autorenew', cancelled: 'block', cashed_out: 'currency_exchange'
    };
    return icons[status] || 'help';
  }
}
