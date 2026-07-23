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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { WithdrawStore } from '../../../stores/withdraw.store';

@Component({
  selector: 'app-withdraw-mobile',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatAutocompleteModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatSlideToggleModule
  ],
  templateUrl: './withdraw-mobile.component.html',
  styleUrls: ['./withdraw-mobile.component.scss']
})
export class WithdrawMobileComponent implements OnInit {
  readonly store = inject(WithdrawStore);
  private _snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.store.init();
  }

  submitWithdrawal() {
    this.store.submitWithdrawal((msg) => {
      this._snackBar.open(msg, 'OK', { duration: 4000 });
    });
  }
}
