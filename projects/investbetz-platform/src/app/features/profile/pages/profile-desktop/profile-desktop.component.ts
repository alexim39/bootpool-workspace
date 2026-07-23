import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { AppNavComponent, OraChatComponent, FaqSectionComponent } from '../../../../core/components';
import { ProfileStore } from '../../stores/profile.store';

@Component({
  selector: 'app-profile-desktop',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatChipsModule, MatTooltipModule, MatDividerModule, MatTabsModule, MatBadgeModule, AppNavComponent, OraChatComponent, FaqSectionComponent
  ],
    templateUrl: './profile-desktop.component.html',
  styleUrls: ['./profile-desktop.component.scss']
})
export class ProfileDesktopComponent implements OnInit {
  readonly store = inject(ProfileStore);
  private _snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.store.init();
  }

  updateProfile() {
    this.store.updateProfile((msg) => this._snackBar.open(msg, 'OK', { duration: 3000 }));
  }

  changePin() {
    this.store.changePin((msg) => this._snackBar.open(msg, 'OK', { duration: 3000 }));
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

  openOraChat() {
    this.store.openOraChat();
  }

  openFaq() {
    this.store.openFaq();
  }

  sendEmail() {
    this.store.sendEmail();
  }

  copyReferralCode() {
    this.store.copyReferralCode((msg) => this._snackBar.open(msg, 'OK', { duration: 2000 }));
  }

  shareReferral() {
    this.store.shareReferral();
  }
}
