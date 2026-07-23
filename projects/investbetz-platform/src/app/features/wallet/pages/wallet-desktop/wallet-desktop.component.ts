import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../../core/services';
import { AppNavComponent, TopUpModalComponent } from '../../../../core/components';
import { WalletStore } from '../../stores/wallet.store';

@Component({
  selector: 'app-wallet-desktop',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatBadgeModule,
    MatChipsModule,
    MatTooltipModule,
    AppNavComponent,
    TopUpModalComponent
  ],
  templateUrl: './wallet-desktop.component.html',
  styleUrls: ['./wallet-desktop.component.scss']
})
export class WalletDesktopComponent implements OnInit {
  readonly store = inject(WalletStore);
  _auth = inject(AuthService);

  displayTopUp = signal(false);
  displayedColumns = ['date', 'type', 'description', 'amount', 'status'];

  ngOnInit() {
    this.store.init();
  }

  onPageChange(event: PageEvent) {
    this.store.onPageChange(event.pageIndex);
  }

  openDeposit() { this.displayTopUp.set(true); }
}
