import { Component, inject, signal, computed, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DeviceService, VirtualGamesService, WalletService, VirtualGameId, VirtualGame, PlayResult, PlayHistoryItem, VirtualGameStats, HistoryResultFilter } from '../../core/services';
import { AppNavComponent, MobileNavComponent } from '../../core/components';

interface FxParticle {
  id: number;
  kind: 'confetti' | 'bubble' | 'sparkle';
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  sway: number;
}

@Component({
  selector: 'app-virtual-games',
  standalone: true,
  imports: [RouterModule, CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule, AppNavComponent, MobileNavComponent],
  templateUrl: './virtual-games.component.html',
  styleUrls: ['./virtual-games.component.scss']
})
export class VirtualGamesComponent implements OnInit, AfterViewInit, OnDestroy {
  device = inject(DeviceService);
  isMobileView = computed(() => this.device.isMobile() || this.device.isTablet());
  service = inject(VirtualGamesService);
  wallet = inject(WalletService);
  private snackBar = inject(MatSnackBar);

  catalog = this.service.catalog;
  history = this.service.history;
  historyTotal = this.service.historyTotal;
  stats = this.service.stats;
  loading = this.service.loading;
  statsLoading = this.service.statsLoading;
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
  historyGame = signal<VirtualGameId | 'all'>('all');
  historyResult = signal<HistoryResultFilter>('all');
  refreshing = signal(false);
  verifyingId = signal<string | null>(null);
  verifiedIds = signal<Record<string, boolean>>({});
  ptrState = signal<'idle' | 'pulling' | 'ready' | 'refreshing'>('idle');
  ptrOffset = signal(0);
  fxParticles = signal<FxParticle[]>([]);
  private fxSeq = 0;

  @ViewChild('scrollSentinel') scrollSentinel!: ElementRef<HTMLDivElement>;
  private io: IntersectionObserver | null = null;
  private pullStartY = 0;
  private pullActive = false;

  hasMore = computed(() => this.history().length < this.historyTotal());

  quickAmounts = [100, 200, 500, 1000, 2000, 5000];
  diceFaces = ['1', '2', '3', '4', '5', '6'];
  colorChoices = ['emerald', 'gold', 'white'];

  activeGame = computed<VirtualGame | null>(() => {
    return this.catalog().find(g => g.id === this.activeGameId()) || null;
  });

  actionVerb = computed(() => {
    switch (this.activeGame()?.id) {
      case 'coin_flip': return 'Flip Coin';
      case 'dice': return 'Roll Dice';
      case 'color_wheel': return 'Spin Wheel';
      default: return 'Play';
    }
  });

  actionIcon = computed(() => {
    switch (this.activeGame()?.id) {
      case 'coin_flip': return 'payments';
      case 'dice': return 'casino';
      case 'color_wheel': return '360';
      default: return 'sports_esports';
    }
  });

  spinLabel = computed(() => {
    switch (this.activeGame()?.id) {
      case 'coin_flip': return 'Flipping coin…';
      case 'dice': return 'Rolling dice…';
      case 'color_wheel': return 'Spinning wheel…';
      default: return 'Playing…';
    }
  });

  balance = this.wallet.balance;

  stakeError = computed<string | null>(() => {
    const cfg = this.activeGame();
    if (!cfg) return null;
    const v = this.stakeAmount();
    if (v <= 0) return null;
    if (v < cfg.minStake) return `Minimum stake is ${this.formatMoney(cfg.minStake)}`;
    if (v > cfg.maxStake) return `Max stake per play is ${this.formatMoney(cfg.maxStake)}`;
    return null;
  });

  statsDisplay = computed<VirtualGameStats | null>(() => this.stats());

  ngOnInit() {
    this.service.fetchCatalog(() => this.applyHomeChoice(this.activeGameId()));
    this.service.fetchHistory();
    this.service.fetchStats();
  }

  ngAfterViewInit() {
    if (typeof IntersectionObserver === 'undefined') return;
    this.io = new IntersectionObserver(
      (entries) => {
        if (entries.some(e => e.isIntersecting) && this.hasMore() && !this.historyLoading()) {
          this.loadMoreHistory();
        }
      },
      { rootMargin: '260px' }
    );
    this.io.observe(this.scrollSentinel.nativeElement);
  }

  ngOnDestroy() {
    this.io?.disconnect();
  }

  applyHomeChoice(gameId: VirtualGameId) {
    this.activeGameId.set(gameId);
    const cfg = this.catalog().find(g => g.id === gameId);
    if (cfg) this.choice.set(cfg.outcomes[0]);
  }

  setHistoryGame(game: VirtualGameId | 'all') {
    if (this.historyGame() === game) return;
    this.historyGame.set(game);
    this.historyPage.set(1);
    this.service.fetchHistory(1, 20, game, this.historyResult());
  }

  setHistoryResult(result: HistoryResultFilter) {
    if (this.historyResult() === result) return;
    this.historyResult.set(result);
    this.historyPage.set(1);
    this.service.fetchHistory(1, 20, this.historyGame(), result);
  }

  refresh() {
    this.refreshing.set(true);
    this.service.fetchCatalog(
      () => this.finishRefresh(),
      () => this.finishRefresh()
    );
  }

  private finishRefresh() {
    this.applyHomeChoice(this.activeGameId());
    this.service.fetchHistory(1, 20, this.historyGame(), this.historyResult());
    this.service.fetchStats();
    this.wallet.fetchBalance();
    this.refreshing.set(false);
    this.ptrState.set('idle');
    this.ptrOffset.set(0);
  }

  onPtrStart(e: TouchEvent) {
    if (this.isMobileView() && window.scrollY <= 0 && this.ptrState() !== 'refreshing') {
      this.pullActive = true;
      this.pullStartY = e.touches[0].clientY;
    }
  }

  onPtrMove(e: TouchEvent) {
    if (!this.pullActive || this.ptrState() === 'refreshing') return;
    const dy = e.touches[0].clientY - this.pullStartY;
    if (window.scrollY > 0 || dy <= 0) {
      this.ptrOffset.set(0);
      this.ptrState.set('idle');
      return;
    }
    this.ptrOffset.set(Math.min(92, Math.round(dy * 0.5)));
    this.ptrState.set(dy >= 140 ? 'ready' : 'pulling');
  }

  onPtrEnd() {
    if (!this.pullActive) return;
    this.pullActive = false;
    if (this.ptrState() === 'ready') {
      this.ptrState.set('refreshing');
      this.refresh();
    } else {
      this.ptrState.set('idle');
      this.ptrOffset.set(0);
    }
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

  clampStake() {
    const cfg = this.activeGame();
    if (!cfg) return;
    const v = Math.max(cfg.minStake, Math.min(this.stakeAmount(), cfg.maxStake));
    this.stakeAmount.set(v);
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
    if (this.playing()) return;
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
    this.fxParticles.set([]);
    const idempotencyKey = this.service.generateIdempotencyKey();
    this.service.play(cfg.id, this.choice(), this.stakeAmount(), idempotencyKey).subscribe({
      next: (res) => {
        this.service.donePlaying();
        this.playing.set(false);
        if (res.success) {
          this.lastResult.set(res.data);
          if (res.data.result === 'win') this.spawnWinFx();
          this.wallet.fetchBalance();
          this.service.fetchHistory(1, 20, this.historyGame(), this.historyResult());
          this.service.fetchStats();
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

  verifyHistoryItem(item: PlayHistoryItem) {
    if (this.verifyingId() || this.verifiedIds()[item._id] === true) return;
    const cfg = this.catalog().find(g => g.id === item.game);
    if (!cfg || !item.seed) {
      this.snackBar.open('This play has no verifiable seed', 'OK', { duration: 2500 });
      return;
    }
    this.verifyingId.set(item._id);
    const res: PlayResult = {
      playId: item._id,
      game: item.game,
      choice: item.choice,
      outcome: item.outcome,
      result: item.result,
      stakeAmount: item.stakeAmount,
      multiplier: item.multiplier,
      payoutAmount: item.payoutAmount,
      seed: item.seed,
      verificationHash: item.verificationHash || '',
      balanceAfter: 0,
      playedAt: item.playedAt,
    };
    this.service.verifyResult(res, cfg)
      .then(ok => {
        this.verifiedIds.update(m => ({ ...m, [item._id]: ok }));
        this.verifyingId.set(null);
        if (!ok) this.snackBar.open('Verification failed — seed/replay mismatch', 'OK', { duration: 3000 });
      })
      .catch(() => {
        this.verifiedIds.update(m => ({ ...m, [item._id]: false }));
        this.verifyingId.set(null);
      });
  }

  closeResult() {
    this.lastResult.set(null);
    this.fxParticles.set([]);
  }

  private spawnWinFx() {
    const colors = ['#00E676', '#F5B301', '#FFD24A', '#69F0AE', '#FF8A80', '#40C4FF', '#FFFFFF'];
    const parts: FxParticle[] = [];
    for (let i = 0; i < 46; i++) {
      const roll = Math.random();
      const kind = roll < 0.45 ? 'confetti' : roll < 0.75 ? 'bubble' : 'sparkle';
      parts.push({
        id: ++this.fxSeq,
        kind,
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        duration: 2.4 + Math.random() * 2.2,
        size: kind === 'bubble' ? 8 + Math.random() * 14 : 5 + Math.random() * 9,
        color: colors[Math.floor(Math.random() * colors.length)],
        sway: (Math.random() * 2 - 1) * 70,
      });
    }
    this.fxParticles.set(parts);
  }

  loadMoreHistory() {
    if (this.historyLoading() || !this.hasMore()) return;
    this.historyPage.set(this.historyPage() + 1);
    this.service.fetchHistory(this.historyPage(), 20, this.historyGame(), this.historyResult(), true);
  }
}
