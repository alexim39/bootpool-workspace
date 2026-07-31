import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AppNavComponent } from '../../../../core/components';

@Component({
  selector: 'app-guide-desktop',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, AppNavComponent],
  templateUrl: './guide-desktop.component.html',
  styleUrls: ['./guide-desktop.component.scss'],
})
export class GuideDesktopComponent {
  readonly steps = [
    { icon: 'person_add', title: 'Create your account', text: 'Sign up with your phone number, secure your wallet with a PIN, and verify your identity to start staking.' },
    { icon: 'account_balance_wallet', title: 'Fund your wallet', text: 'Deposit instantly via bank transfer or card using Paystack. Your balance updates the moment your deposit is confirmed.' },
    { icon: 'sports_soccer', title: 'Pick your game', text: 'Choose a Pod or a Match Pool, review the odds, and stake any amount within the range. Cashback pods refund part of your stake if the selection loses.' },
    { icon: 'payments', title: 'Get paid instantly', text: 'Winning selections pay out to your wallet immediately after settlement. Withdraw to your bank account anytime.' },
  ];

  readonly features = [
    { icon: 'emoji_events', title: 'Pods — Pool Betting', color: '#00E676', text: 'Everyone stakes into the same selection pool for better returns. If a Pod with cashback loses, you get a percentage of your stake back.' },
    { icon: 'groups', title: 'Match Pools', color: '#E8B923', text: 'Team-based pools where you back a team to win its match. Multiple backers share the pool; the winning team\'s pool splits the pot.' },
    { icon: 'auto_awesome', title: 'Ora AI', color: '#CE93D8', text: 'BetPool\'s in-house AI curates fixtures, checks settlements against live sports data, and manages Bet Manager portfolios for you.' },
    { icon: 'shield', title: 'Bet Manager Tiers', color: '#90CAF9', text: 'Goalkeeper to Striker — four AI-managed risk tiers. Deposit for a 30-day cycle; Ora allocates your balance across Pods and Pools.' },
    { icon: 'autorenew', title: 'Refunds & Cashback', color: '#FFB74D', text: 'Voided matches refund your full stake. Cashback Pods return a percentage when the selection loses. Bet Manager cycles are locked for 30 days.' },
    { icon: 'account_balance', title: 'Instant Withdrawals', color: '#64B5F6', text: 'Withdraw your available balance to your bank account in seconds. Failed transfers are automatically refunded to your wallet.' },
  ];

  readonly facts = [
    'Stakes are settled within minutes of the final whistle.',
    'Each Pod shows its odds (e.g. 2.10x) and cashback percentage before you stake.',
    'Accumulators combine 2–5 selections into one bet with combined odds.',
    'Bet Manager charges a 20% performance fee only on net profit.',
    'You must verify your identity (KYC) before placing bets or withdrawing.',
    'Locked Bet Manager funds unlock after the 30-day cycle ends.',
  ];
}
