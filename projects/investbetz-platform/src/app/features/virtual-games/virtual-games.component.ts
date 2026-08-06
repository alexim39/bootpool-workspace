import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DeviceService, VirtualGamesService, WalletService, VirtualGameId, VirtualGame, PlayResult } from '../../core/services';
import { AppNavComponent, MobileNavComponent } from '../../core/components';

@Component({
  selector: 'app-virtual-games',
  standalone: true,
  imports: [RouterModule, CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule, AppNavComponent, MobileNavComponent],
  templateUrl: './virtual-games.component.html',
  styleUrls: ['./virtual-games.component.scss']
})
export class VirtualGamesComponent implements OnInit {
  device = inject(DeviceService);
  isMobileView = computed(() => this.device.isMobile() || this.device.isTablet());
  service = inject(VirtualGamesService);
  wallet = inject(WalletService);
  private snackBar = inject(MatSnackBar);

  catalog = this.service.catalog;
  history = this.service.history;
  historyTotal = this.service.historyTotal;
  loading = this.service.loading;
  historyLoading = this.service.historyLoading;
  playing = this.service.playing;
  errorSig = this.service.error;

  activeGameId = signal<VirtualGameId>('coin_flip');
  choice = signal<string>('');
  stakeAmount = signal(1000);
  lastResult = signal<PlayResult | null>(null);
  verifying = signal(false);
  verified = signal<boolean | null>(null);
  historyPage = signal(1);

  quickAmounts = [100, 200, 500, 1000, 2000, 5000];
  diceFaces = ['1', '2', '3', '4', '5', '6'];
  colorChoices = ['emerald', 'gold', 'white'];

  activeGame = computed<VirtualGame | null>(() => {
    return this.catalog().find(g => g.id === this.activeGameId()) || null;
  });

  balance = this.wallet.balance;

  ngOnInit() {
    this.service.fetchCatalog(() => this.applyHomeChoice(this.activeGameId()));
    this.service.fetchHistory();
  }

  applyHomeChoice(gameId: VirtualGameId) {
    this.activeGameId.set(gameId);
    const cfg = this.catalog().find(g => g.id === gameId);
    if (cfg) this.choice.set(cfg.outcomes[0]);
  }

  formatMoney(n: number): string {
    return '₦' + n.toLocaleString('en-US');
  }

  winPayout(game: VirtualGame): number {
    return Math.floor(this.stakeAmount() * game.multiplier);
  }

  gameName(id: string): string {
    const g = this.catalog().find(c => c.id === id);
    return g ? g.name : id;
  }

  gameIcon(id: string): string {
    const g = this.catalog().find(c => c.id === id);
    return g ? g.icon : 'casino';
  }

  onAmountInput(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.stakeAmount.set(Number.isFinite(value) && value > 0 ? Math.floor(value) : 0);
  }

  multiplierLabel(game: VirtualGame | null): string {
    return game ? `${game.multiplier.toFixed(1)}x` : '';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-NG', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  play() {
    const cfg = this.activeGame();
    if (!cfg || !cfg.enabled) return;
    if (!this.choice()) {
      this.snackBar.open('Pick an outcome first', 'OK', { duration: 2000 });
      return;
    }
    if (this.stakeAmount() < cfg.minStake) {
      this.snackBar.open(`Minimum stake is ${this.formatMoney(cfg.minStake)}`, 'OK', { duration: 2500 });
      return;
    }
    if (this.stakeAmount() > cfg.maxStake) {
      this.snackBar.open(`Max stake per play is ${this.formatMoney(cfg.maxStake)}`, 'OK', { duration: 2500 });
      return;
    }

    this.playing.set(true);
    this.verified.set(null);
    this.service.play(cfg.id, this.choice(), this.stakeAmount()).subscribe({
      next: (res) => {
        this.service.donePlaying();
        this.playing.set(false);
        if (res.success) {
          this.lastResult.set(res.data);
          this.wallet.fetchBalance();
          this.service.fetchHistory();
        } else {
          this.snackBar.open(res.message || 'Failed to play', 'OK', { duration: 3000 });
        }
      },
      error: (err) => {
        this.service.donePlaying();
        this.playing.set(false);
        this.snackBar.open(err.error?.message || 'Failed to play', 'OK', { duration: 3000 });
      }
    });
  }

  verify() {
    const res = this.lastResult();
    const cfg = this.activeGame();
    if (!res || !cfg) return;
    this.verifying.set(true);
    this.service.verifyResult(res, cfg).then(ok => {
      this.verified.set(ok);
      this.verifying.set(false);
    }).catch(() => {
      this.verified.set(false);
      this.verifying.set(false);
    });
  }

  closeResult() {
    this.lastResult.set(null);
  }

  loadMoreHistory() {
    this.historyPage.set(this.historyPage() + 1);
    this.service.fetchHistory(this.historyPage(), 20);
  }
}