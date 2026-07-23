import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../../core/services';
import { TopUpModalComponent, MobileNavComponent } from '../../../../core/components';
import { WalletStore } from '../../stores/wallet.store';

@Component({
  selector: 'app-wallet-mobile',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatBadgeModule,
    TopUpModalComponent, MobileNavComponent
  ],
  templateUrl: './wallet-mobile.component.html',
  styleUrls: ['./wallet-mobile.component.scss']
})
export class WalletMobileComponent implements OnInit {
  readonly store = inject(WalletStore);
  _auth = inject(AuthService);

  showTopUp = signal(false);
  activeFilter = signal<'all' | 'deposit' | 'withdrawal'>('all');
  filteredTransactions = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.store.transactions();
    return this.store.transactions().filter(t => t.type === filter);
  });

  ngOnInit() {
    this.store.init();
  }
}
