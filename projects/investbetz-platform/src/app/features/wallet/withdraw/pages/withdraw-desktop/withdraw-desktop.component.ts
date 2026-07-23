import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AppNavComponent } from '../../../../../core/components';
import { WithdrawStore } from '../../../stores/withdraw.store';

@Component({
  selector: 'app-withdraw-desktop',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatAutocompleteModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule, MatSlideToggleModule, AppNavComponent
  ],
  templateUrl: './withdraw-desktop.component.html',
  styleUrls: ['./withdraw-desktop.component.scss']
})
export class WithdrawDesktopComponent implements OnInit {
  readonly store = inject(WithdrawStore);
  private _snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.store.init();
  }

  removeSaved(id: string) {
    this.store.removeSaved(id);
    this._snackBar.open('Account removed', '', { duration: 2000 });
  }

  submitWithdrawal() {
    this.store.submitWithdrawal((msg) => {
      this._snackBar.open(msg, 'OK', { duration: 5000, panelClass: 'snack-success' });
    });
  }
}
