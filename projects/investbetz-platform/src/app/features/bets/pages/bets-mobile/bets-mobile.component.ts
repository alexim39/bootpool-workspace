import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { CashoutModalComponent } from '../../../home/components/cashout-modal/cashout-modal.component';
import { MobileNavComponent } from '../../../../core/components';
import { BetsStore } from '../../stores/bets.store';

@Component({
  selector: 'app-bets-mobile',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatChipsModule, CashoutModalComponent, MobileNavComponent
  ],
  templateUrl: './bets-mobile.component.html',
  styleUrls: ['./bets-mobile.component.scss']
})
export class BetsMobileComponent implements OnInit {
  readonly store = inject(BetsStore);

  activeTab = signal<'active' | 'history'>('active');

  ngOnInit() {
    this.store.init();
  }
}
