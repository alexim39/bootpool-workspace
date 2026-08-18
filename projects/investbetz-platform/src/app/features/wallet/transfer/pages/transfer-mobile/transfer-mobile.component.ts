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
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MobileNavComponent } from '../../../../../core/components';
import { RecipientMatch } from '../../../../../core/services';
import { TransferStore, TRANSFER_PAGE_SIZES, TRANSFER_SORT_OPTIONS } from '../../../stores/transfer.store';

@Component({
  selector: 'app-transfer-mobile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MobileNavComponent,
  ],
  templateUrl: './transfer-mobile.component.html',
  styleUrls: ['./transfer-mobile.component.scss']
})
export class TransferMobileComponent implements OnInit {
  readonly store = inject(TransferStore);
  readonly pageSizes = TRANSFER_PAGE_SIZES;
  readonly sortOptions = TRANSFER_SORT_OPTIONS;
  private readonly _snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.store.init();
  }

  displayRecipient(r: RecipientMatch | string): string {
    return typeof r === 'object' && r ? r.fullName : String(r || '');
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent) {
    const r = event.option.value as RecipientMatch;
    if (r && r.id) this.store.selectRecipient(r);
  }

  submitTransfer() {
    this.store.submitTransfer((msg) => this._snackBar.open(msg, 'OK', { duration: 4000 }));
  }

  exportAll() {
    this.store.exportAllCsv((msg) => this._snackBar.open(msg, 'OK', { duration: 4000 }));
  }

  exportSelected() {
    this.store.exportSelectedCsv();
    this._snackBar.open('CSV downloaded', 'OK', { duration: 3000 });
  }
}