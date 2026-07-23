import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Pod } from '../../../../core/services';
import { PodCardComponent } from '../../components/pod-card/pod-card.component';
import { StakeModalComponent } from '../../components/stake-modal/stake-modal.component';
import { BetSlipComponent } from '../../components/bet-slip/bet-slip.component';
import { FeaturedBannerComponent } from '../../components/featured-banner/featured-banner.component';
import { TopUpModalComponent } from '../../../../core/components';
import { MobileNavComponent } from '../../../../core/components';
import { HomeStore } from '../../stores/home.store';

@Component({
  selector: 'app-home-mobile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    PodCardComponent,
    StakeModalComponent,
    BetSlipComponent,
    FeaturedBannerComponent,
    TopUpModalComponent,
    MobileNavComponent
  ],
  templateUrl: './home-mobile.component.html',
  styleUrls: ['./home-mobile.component.scss']
})
export class HomeMobileComponent implements OnInit {
  private _snackBar = inject(MatSnackBar);
  readonly store = inject(HomeStore);

  showTopUp = signal(false);

  ngOnInit() {
    this.store.init();
  }

  openStakeModal(pod: Pod) {
    if (!this.store.auth.isAuthenticated()) {
      this._snackBar.open('Please log in to place a stake', 'OK', { duration: 3000 });
      return;
    }
    this.store.openStakeModal(pod);
  }

  onStakePlaced() {
    this.store.onStakePlaced();
    this._snackBar.open('Stake placed successfully!', 'OK', { duration: 2000 });
  }

  toggleSelection(pod: Pod) {
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

  closeSlip() { this.store.betSlipOpen.set(false); }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
