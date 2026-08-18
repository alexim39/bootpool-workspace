import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MobileNavComponent, OraChatComponent, FaqSectionComponent } from '../../../../core/components';
import { ProfileStore } from '../../stores/profile.store';
import { LoyaltyService, CoachingService } from '../../../../core/services';

@Component({
  selector: 'app-profile-mobile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatChipsModule, MatProgressBarModule, MobileNavComponent, OraChatComponent, FaqSectionComponent
  ],
  templateUrl: './profile-mobile.component.html',
  styleUrls: ['./profile-mobile.component.scss']
})
export class ProfileMobileComponent implements OnInit, AfterViewInit {
  readonly store = inject(ProfileStore);
  readonly loyalty = inject(LoyaltyService);
  readonly coaching = inject(CoachingService);
  private _snackBar = inject(MatSnackBar);

  ngOnInit() {}

  ngAfterViewInit() {
    this.store.init();
    this.loyalty.fetchSnapshot();
    this.coaching.fetchInsights();
  }

  updateProfile() {
    this.store.updateProfile((msg) => this._snackBar.open(msg, 'OK', { duration: 3000 }));
  }

  changePin() {
    this.store.changePin((msg) => this._snackBar.open(msg, 'OK', { duration: 3000 }));
  }

  deleteAccount() {
    this.store.deleteAccount((msg) => this._snackBar.open(msg, 'OK', { duration: 5000 }));
  }

  requestPhoneVerification() {
    this.store.requestPhoneVerification((msg) => this._snackBar.open(msg, 'OK', { duration: 3000 }));
  }

  confirmPhoneVerification() {
    this.store.confirmPhoneVerification((msg) => this._snackBar.open(msg, 'OK', { duration: 3000 }));
  }

  submitKyc() {
    this.store.submitKyc((msg) => this._snackBar.open(msg, 'OK', { duration: 3000 }));
  }

  copyReferralCode() {
    this.store.copyReferralCode((msg) => this._snackBar.open(msg, 'OK', { duration: 2000 }));
  }

  shareReferral() {
    this.store.shareReferral();
  }

  openOraChat() {
    this.store.openOraChat();
  }

  openFaq() {
    this.store.openFaq();
  }

  sendEmail() {
    this.store.sendEmail();
  }
}
