import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PodCardComponent } from '../../components/pod-card/pod-card.component';
import { StakeModalComponent } from '../../components/stake-modal/stake-modal.component';
import { BetSlipComponent } from '../../components/bet-slip/bet-slip.component';
import { FeaturedBannerComponent } from '../../components/featured-banner/featured-banner.component';
import { AppNavComponent } from '../../../../core/components';
import { HomeStore } from '../../stores/home.store';

@Component({
  selector: 'app-home-desktop',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
    PodCardComponent,
    StakeModalComponent,
    BetSlipComponent,
    FeaturedBannerComponent,
    AppNavComponent
  ],
  templateUrl: './home-desktop.component.html',
  styleUrls: ['./home-desktop.component.scss']
})
export class HomeDesktopComponent implements OnInit {
  private _snackBar = inject(MatSnackBar);
  readonly store = inject(HomeStore);

  ngOnInit() {
    this.store.init();
  }

  openStakeModal(pod: any) {
    if (!this.store.auth.isAuthenticated()) {
      this._snackBar.open('Please log in to place a stake', 'OK', { duration: 3000 });
      return;
    }
    this.store.openStakeModal(pod);
  }

  toggleSelection(pod: any) {
    if (!this.store.auth.isAuthenticated()) {
      this._snackBar.open('Please log in to place a stake', 'OK', { duration: 3000 });
      return;
    }
    if (this.store.betSlipSelections().length >= 5 && !this.store.isSelected(pod.id)) {
      this._snackBar.open('Maximum of 5 selections allowed', 'OK', { duration: 2000 });
      return;
    }
    this.store.toggleSelection(pod);
  }

  onPlaceAccumulator(data: { podIds: string[]; stakeAmount: number }) {
    this.store.placeAccumulator(data).subscribe({
      next: (res) => {
        if (res.success) {
          this.store.clearSelections();
          this._snackBar.open('Accumulator placed successfully!', 'OK', { duration: 3000 });
        } else {
          this._snackBar.open(res.message || 'Failed to place accumulator', 'OK', { duration: 3000 });
        }
      },
      error: (err) => {
        this._snackBar.open(err.error?.message || 'Failed to place accumulator', 'OK', { duration: 3000 });
      }
    });
  }

  onStakePlaced() {
    this.store.onStakePlaced();
    this._snackBar.open('Stake placed successfully!', 'OK', { duration: 2000 });
  }

  closeSlip() { this.store.betSlipOpen.set(false); }

}
