import { Component, inject, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth.service';
import { WalletService } from '../../services/wallet.service';
import { StakeService } from '../../services/stake.service';
import { TopUpModalComponent } from '../top-up-modal/top-up-modal.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatButtonModule, MatBadgeModule, MatTooltipModule, TopUpModalComponent, NotificationBellComponent],
  template: `
    <header class="app-nav">
      <div class="nav-inner">
        <div class="nav-left">
          <a routerLink="/home" class="nav-logo">
            <!-- <div class="logo-icon">
              <span class="logo-symbol">B</span>
            </div> -->
            <img src="img/logo/logo.png" alt="BetPool Logo" class="logo-icon">
            <span class="logo-text">
              <span class="brand-bet">Bet</span><span class="brand-pool">Pool</span>
            </span>
          </a>
        </div>

        <nav class="nav-center">
          <a routerLink="/home" routerLinkActive="active" class="nav-link" [routerLinkActiveOptions]="{ exact: true }" #rla="routerLinkActive">
            <mat-icon>home</mat-icon>
            <span>Home</span>
            @if (rla.isActive) {
              <span class="link-indicator"></span>
            }
          </a>
          <a routerLink="/bets" routerLinkActive="active" class="nav-link" #rla2="routerLinkActive">
            <mat-icon>sports_esports</mat-icon>
            <span>Bets</span>
            @if (activeBetsCount() > 0) {
              <span class="nav-badge">{{ activeBetsCount() }}</span>
            }
            @if (rla2.isActive) {
              <span class="link-indicator"></span>
            }
          </a>
          <a routerLink="/wallet" routerLinkActive="active" class="nav-link" #rla3="routerLinkActive">
            <mat-icon>account_balance_wallet</mat-icon>
            <span>Wallet</span>
            @if (rla3.isActive) {
              <span class="link-indicator"></span>
            }
          </a>
          <a routerLink="/match-pools" routerLinkActive="active" class="nav-link" #rlam="routerLinkActive">
            <mat-icon>pool</mat-icon>
            <span>Pools</span>
            @if (rlam.isActive) {
              <span class="link-indicator"></span>
            }
          </a>
          <a routerLink="/profile" routerLinkActive="active" class="nav-link" #rla4="routerLinkActive">
            <mat-icon>person</mat-icon>
            <span>Profile</span>
            @if (rla4.isActive) {
              <span class="link-indicator"></span>
            }
          </a>
        </nav>

        <div class="nav-right">
          <div class="wallet-pill">
            <mat-icon>account_balance_wallet</mat-icon>
            <span class="wallet-amount">{{ formatFull(walletBalance()) }}</span>
          </div>
          <button mat-stroked-button class="top-up-btn" (click)="showTopUp.set(true)">
            <mat-icon>add</mat-icon>
            Top Up
          </button>
          <app-notification-bell />
          <button mat-icon-button (click)="auth.logout()" class="logout-btn">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </div>
    </header>
    <app-top-up-modal [visible]="showTopUp()" [disableClose]="true" (close)="showTopUp.set(false)" />
  `,
  styles: [`
    :host {
      display: block;
    }
    .app-nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 200;
      background: rgba(10, 20, 40, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .app-nav::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(0,230,118,0.15), rgba(232,185,35,0.15), transparent);
    }

    .nav-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 32px;
      height: 60px;
    }

    .nav-left { display: flex; align-items: center; }

    .nav-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }

    .logo-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      //background: linear-gradient(135deg, #00E676, #00C853);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 800;
      color: #0A1428;
      font-family: 'Exo-ExtraBold', 'Inter', sans-serif;
      flex-shrink: 0;
      margin-right: -5px;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 800;
      font-family: 'Exo-ExtraBold', 'Inter', sans-serif;
      letter-spacing: -0.3px;
    }

    .brand-bet {
      background: linear-gradient(135deg, #00E676 0%, #69F0AE 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .brand-pool {
      background: linear-gradient(135deg, #E8B923 0%, #F0D060 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .nav-center {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 8px;
      text-decoration: none;
      color: rgba(255,255,255,0.5);
      font-size: 13.5px;
      font-weight: 500;
      transition: all 0.2s ease;
      position: relative;
    }

    .nav-link:hover {
      color: rgba(255,255,255,0.85);
      background: rgba(255,255,255,0.04);
    }

    .nav-link.active {
      color: #FFFFFF;
      background: rgba(0,230,118,0.08);
    }

    .nav-link mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .link-indicator {
      position: absolute;
      bottom: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 2px;
      border-radius: 2px;
      background: #00E676;
    }

    .nav-badge {
      background: #E8B923;
      color: #0A1428;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 9999px;
      min-width: 16px;
      text-align: center;
      line-height: 16px;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .wallet-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 8px;
      color: rgba(255,255,255,0.6);
      font-size: 13px;
    }

    .wallet-pill mat-icon {
      font-size: 17px;
      width: 17px;
      height: 17px;
      color: #00E676;
    }

    .wallet-amount {
      font-weight: 700;
      color: #FFFFFF;
    }

    .top-up-btn {
      height: 34px;
      padding: 0 14px;
      font-size: 13px;
      font-weight: 600;
      color: #00E676 !important;
      border: 1px solid rgba(0,230,118,0.25) !important;
      border-radius: 8px !important;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .top-up-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .top-up-btn:hover {
      background: rgba(0,230,118,0.1) !important;
      border-color: rgba(0,230,118,0.5) !important;
    }

    .logout-btn {
      color: rgba(255,255,255,0.3);
      transition: color 0.2s ease;
    }

    .logout-btn:hover {
      color: #f44336;
    }

    @media (max-width: 768px) {
      .app-nav { display: none; }
    }
  `]
})
export class AppNavComponent {
  private walletService = inject(WalletService);
  private stakeService = inject(StakeService);
  auth = inject(AuthService);

  showTopUp = signal(false);

  walletBalance = computed(() => this.walletService.balance().available || 0);
  activeBetsCount = computed(() => this.stakeService.activeStakes().length);

  formatFull(amount: number): string {
    return '₦' + amount.toLocaleString('en-US');
  }

  formatAmount(amount: number): string {
    if (amount >= 1000000) return '₦' + (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return '₦' + (amount / 1000).toFixed(0) + 'K';
    return '₦' + amount;
  }
}
