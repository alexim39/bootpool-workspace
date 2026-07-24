import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { BetManagerService, BetManagerAccount, BetManagerSummary, NavData, PerformanceData, DepositRecord } from '../services/bet-manager.service';

@Injectable({ providedIn: 'root' })
export class BetManagerStore {
  private _api = inject(BetManagerService);

  loading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  accounts = signal<BetManagerAccount[]>([]);
  selectedTier = signal<string | null>(null);
  summary = signal<BetManagerSummary | null>(null);
  navData = signal<NavData | null>(null);
  performance = signal<PerformanceData | null>(null);
  depositHistory = signal<DepositRecord[]>([]);
  historyTotal = signal(0);

  fetchAccounts() {
    this.loading.set(true);
    this.error.set(null);
    this._api.getAccounts().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res) => { if (res.success) this.accounts.set(res.data); },
      error: (err) => this.error.set(err.error?.message || 'Failed to load accounts'),
    });
  }

  fetchAccount(tier: string) {
    this.loading.set(true);
    this.error.set(null);
    this.selectedTier.set(tier);
    this._api.getAccount(tier).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res) => { if (res.success) this.summary.set(res.data); },
      error: (err) => this.error.set(err.error?.message || 'Failed to load account'),
    });
  }

  fetchNav(tier: string) {
    this._api.getNav(tier).subscribe({
      next: (res) => { if (res.success) this.navData.set(res.data); },
    });
  }

  fetchPerformance(tier: string) {
    this._api.getPerformance(tier).subscribe({
      next: (res) => { if (res.success) this.performance.set(res.data); },
    });
  }

  fetchDepositHistory(tier: string, page = 1) {
    this._api.getDepositHistory(tier, page).subscribe({
      next: (res) => {
        if (res.success) {
          this.depositHistory.set(res.data.deposits);
          this.historyTotal.set(res.data.total);
        }
      },
    });
  }

  deposit(tier: string, amount: number, onSuccess: () => void) {
    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);
    this._api.deposit(tier, amount).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage.set(res.message);
          this.fetchAccounts();
          onSuccess();
        } else {
          this.error.set(res.message || 'Deposit failed');
        }
      },
      error: (err) => this.error.set(err.error?.message || 'Deposit failed'),
    });
  }

  withdraw(tier: string, onSuccess: () => void) {
    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);
    this._api.withdraw(tier).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage.set(res.message);
          this.fetchAccounts();
          onSuccess();
        } else {
          this.error.set(res.message || 'Withdrawal failed');
        }
      },
      error: (err) => this.error.set(err.error?.message || 'Withdrawal failed'),
    });
  }

  clearMessages() {
    this.error.set(null);
    this.successMessage.set(null);
  }
}
