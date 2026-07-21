import { Component, inject, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Pod } from '../../core/services/pod.service';
import { WalletService } from '../../core/services/wallet.service';

export interface BetSlipSelection {
  pod: Pod;
}

@Component({
  selector: 'app-bet-slip',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule
  ],
  template: `
    <div class="bet-slip" [class.open]="open()">
      <!-- Header -->
      <div class="slip-header" (click)="togglePanel.emit()">
        <div class="slip-header-left">
          <mat-icon>receipt_long</mat-icon>
          <span>Bet Slip</span>
          @if (selections().length > 0) {
            <span class="slip-count">{{ selections().length }}</span>
          }
        </div>
        <button class="slip-clear-btn" *ngIf="selections().length > 0" (click)="clearAllSelections.emit(); $event.stopPropagation()">
          Clear all
        </button>
        <button class="slip-toggle-btn" *ngIf="open()" (click)="closePanel.emit(); $event.stopPropagation()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Empty State -->
      @if (selections().length === 0) {
        <div class="slip-empty">
          <mat-icon>touch_app</mat-icon>
          <p>Tap the <mat-icon>add_2</mat-icon> on odds to add selections</p>
        </div>
      } @else {
        <!-- Selections List -->
        <div class="slip-selections">
          @for (sel of selections(); track sel.id; let i = $index) {
            <div class="slip-selection">
              <div class="sel-header">
                <span class="sel-num">{{ i + 1 }}</span>
                <span class="sel-teams">{{ sel.homeTeam }} vs {{ sel.awayTeam }}</span>
                <button class="sel-remove" (click)="remove.emit(sel.id)">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <div class="sel-details">
                <span class="sel-market">{{ sel.selection }}</span>
                <span class="sel-odds">{{ sel.gainsMultiplier.toFixed(2) }}x</span>
              </div>
            </div>
          }
        </div>

        <!-- Combined Odds -->
        <div class="slip-combined">
          <span>Combined Odds</span>
          <span class="combined-value">{{ combinedMultiplier().toFixed(2) }}x</span>
        </div>

        <!-- Stake Input -->
        <div class="slip-stake">
          <div class="stake-input-row">
            <span class="stake-label">Stake</span>
            <div class="stake-input-wrap">
              <span class="stake-currency">₦</span>
              <input
                type="number"
                class="stake-input"
                [(ngModel)]="stakeAmount"
                (input)="validateStake()"
                placeholder="Enter amount"
                min="100"
                max="5000" />
            </div>
          </div>
          <div class="quick-picks">
            @for (amt of quickAmounts(); track amt) {
              <button class="quick-pick" [class.active]="stakeAmount() === amt" (click)="setAmount(amt)">
                ₦{{ amt | number }}
              </button>
            }
          </div>
          <div class="stake-error" *ngIf="stakeError()">{{ stakeError() }}</div>
        </div>

        <!-- Payout Preview -->
        <div class="slip-payout">
          <div class="payout-row">
            <span>Potential Payout</span>
            <span class="payout-value">{{ formatCurrency(potentialPayout()) }}</span>
          </div>
          <div class="payout-row fee">
            <span>Platform Fee (10%)</span>
            <span>{{ formatCurrency(platformFee()) }}</span>
          </div>
          <div class="payout-row net">
            <span>Net Payout</span>
            <span class="net-value">{{ formatCurrency(netPayout()) }}</span>
          </div>
        </div>

        <!-- Place Bet -->
        <button class="place-bet-btn" [disabled]="!canPlace()" (click)="placeBet()">
          @if (submitting()) {
            <span>Placing...</span>
          } @else {
            <span>Place Bet</span>
            <span class="btn-sub">₦{{ stakeAmount() | number }}</span>
          }
        </button>
      }

      <!-- Mobile overlay -->
      @if (open()) {
        <div class="slip-overlay" (click)="closePanel.emit()"></div>
      }
    </div>
  `,
  styles: [`
    .bet-slip {
      background: #0D1A30;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .slip-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      background: rgba(255,255,255,0.03);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      cursor: pointer;
    }
    .slip-header-left { display: flex; align-items: center; gap: 8px; color: #fff; font-size: 14px; font-weight: 600; }
    .slip-header-left mat-icon { color: #00E676; font-size: 20px; width: 20px; height: 20px; }
    .slip-count { background: #00E676; color: #0A1428; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
    .slip-clear-btn { background: none; border: none; color: rgba(255,255,255,0.4); font-size: 11px; cursor: pointer; padding: 2px 6px; border-radius: 4px; }
    .slip-clear-btn:hover { color: #f44336; background: rgba(244,67,54,0.1); }
    .slip-toggle-btn { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; padding: 2px; display: none; }

    .slip-empty { display: flex; flex-direction: column; align-items: center; padding: 40px 24px; color: rgba(255,255,255,0.3); gap: 12px; text-align: center; }
    .slip-empty mat-icon:first-child { font-size: 48px; width: 48px; height: 48px; color: rgba(0,230,118,0.5); background: rgba(0,230,118,0.08); border-radius: 50%; padding: 10px; box-sizing: content-box; }
    .slip-empty p { margin: 0; font-size: 13px; line-height: 1.5; color: rgba(255,255,255,0.4); display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; justify-content: center; }
    .slip-empty p mat-icon { font-size: 16px; width: 16px; height: 16px; /* color: #00E676; */ color: rgba(255,255,255,0.4); vertical-align: middle; }

    .slip-selections { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; max-height: 240px; overflow-y: auto; }
    .slip-selection { background: rgba(255,255,255,0.04); border-radius: 8px; padding: 8px 10px; }
    .sel-header { display: flex; align-items: center; gap: 6px; }
    .sel-num { width: 18px; height: 18px; border-radius: 50%; background: rgba(0,230,118,0.15); color: #00E676; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
    .sel-teams { flex: 1; font-size: 12px; color: #fff; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sel-remove { background: none; border: none; color: rgba(255,255,255,0.25); cursor: pointer; padding: 0; display: flex; }
    .sel-remove:hover { color: #f44336; }
    .sel-remove mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .sel-details { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; padding-left: 24px; }
    .sel-market { font-size: 11px; color: rgba(255,255,255,0.5); }
    .sel-odds { font-size: 12px; color: #E8B923; font-weight: 600; }

    .slip-combined { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 13px; color: rgba(255,255,255,0.6); }
    .combined-value { color: #E8B923; font-weight: 700; font-size: 15px; }

    .slip-stake { padding: 0 16px 10px; }
    .stake-input-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .stake-label { font-size: 12px; color: rgba(255,255,255,0.5); white-space: nowrap; }
    .stake-input-wrap { flex: 1; display: flex; align-items: center; background: rgba(255,255,255,0.06); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); padding: 0 10px; }
    .stake-input-wrap:focus-within { border-color: #00E676; }
    .stake-currency { color: rgba(255,255,255,0.4); font-size: 14px; margin-right: 4px; }
    .stake-input { flex: 1; background: none; border: none; outline: none; color: #fff; font-size: 14px; font-weight: 600; padding: 10px 0; width: 100%; }
    .stake-input::-webkit-inner-spin-button { -webkit-appearance: none; }
    .quick-picks { display: flex; gap: 6px; flex-wrap: wrap; }
    .quick-pick { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; color: rgba(255,255,255,0.7); font-size: 11px; padding: 5px 10px; cursor: pointer; transition: all 0.15s; }
    .quick-pick:hover { background: rgba(0,230,118,0.1); border-color: #00E676; color: #00E676; }
    .quick-pick.active { background: #00E676; border-color: #00E676; color: #0A1428; font-weight: 600; }
    .stake-error { color: #f44336; font-size: 11px; margin-top: 4px; }

    .slip-payout { padding: 0 16px 12px; border-top: 1px solid rgba(255,255,255,0.06); }
    .payout-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 12px; color: rgba(255,255,255,0.5); }
    .payout-row.fee { border-bottom: 1px solid rgba(255,255,255,0.04); }
    .payout-row.net { padding-top: 8px; }
    .payout-value { color: #00E676; font-weight: 600; font-size: 13px; }
    .net-value { color: #00E676; font-weight: 700; font-size: 15px; }

    .place-bet-btn { margin: 0 16px 14px; padding: 12px; border: none; border-radius: 8px; background: linear-gradient(135deg, #00E676, #00C853); color: #0A1428; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.15s; }
    .place-bet-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .place-bet-btn:not(:disabled):hover { opacity: 0.9; }
    .place-bet-btn .btn-sub { font-size: 11px; font-weight: 500; opacity: 0.7; }

    .slip-overlay { display: none; }

    @media (max-width: 768px) {
      .bet-slip { position: fixed; bottom: 60px; left: 0; right: 0; z-index: 1000; border-radius: 16px 16px 0 0; max-height: calc(70vh - 60px); transform: translateY(calc(100% - 50px)); transition: transform 0.3s ease; padding-bottom: env(safe-area-inset-bottom, 0); }
      .bet-slip.open { transform: translateY(0); }
      .slip-toggle-btn { display: flex !important; }
      .slip-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: -1; }
      .bet-slip:not(.open) .slip-selections,
      .bet-slip:not(.open) .slip-combined,
      .bet-slip:not(.open) .slip-stake,
      .bet-slip:not(.open) .slip-payout,
      .bet-slip:not(.open) .place-bet-btn { display: none; }
    }
  `]
})
export class BetSlipComponent {
  private wallet = inject(WalletService);
  private snackBar = inject(MatSnackBar);

  selections = input<Pod[]>([]);
  open = input(false);
  remove = output<string>();
  clearAllSelections = output<void>();
  closePanel = output<void>();
  togglePanel = output<void>();
  placeBetRequest = output<{ podIds: string[]; stakeAmount: number }>();

  stakeAmount = signal<number>(0);
  submitting = signal(false);

  stakeError = signal<string | null>(null);

  availableBalance = computed(() => this.wallet.balance().available || 0);

  combinedMultiplier = computed(() => {
    return this.selections().reduce((acc, p) => acc * p.gainsMultiplier, 1);
  });

  potentialPayout = computed(() => {
    return Math.floor(this.stakeAmount() * this.combinedMultiplier());
  });

  platformFee = computed(() => {
    const feePercent = 10;
    return Math.floor(this.potentialPayout() * (feePercent / 100));
  });

  netPayout = computed(() => this.potentialPayout() - this.platformFee());

  quickAmounts = computed(() => {
    const balance = this.availableBalance();
    return [100, 200, 500, 1000, 2000, 5000].filter(a => a <= balance);
  });

  canPlace = computed(() => {
    return this.selections().length >= 2
      && this.stakeAmount() >= 100
      && this.stakeAmount() <= 5000
      && !this.stakeError()
      && !this.submitting();
  });

  setAmount(amount: number) {
    this.stakeAmount.set(amount);
    this.validateStake();
  }

  validateStake() {
    const amt = this.stakeAmount();
    if (amt < 100) {
      this.stakeError.set('Minimum accumulator stake is ₦100');
    } else if (amt > 5000) {
      this.stakeError.set('Maximum accumulator stake is ₦5,000');
    } else if (amt > this.availableBalance()) {
      this.stakeError.set('Insufficient balance');
    } else {
      this.stakeError.set(null);
    }
  }

  clearAll() {
    this.stakeAmount.set(0);
    this.stakeError.set(null);
    this.submitting.set(false);
  }

  placeBet() {
    if (!this.canPlace()) return;

    const podIds = this.selections().map(s => s.id);
    this.submitting.set(true);
    this.placeBetRequest.emit({ podIds, stakeAmount: this.stakeAmount() });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount || 0);
  }
}
