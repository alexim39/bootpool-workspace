import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MobileNavComponent } from '../../../../core/components';

@Component({
  selector: 'app-guide-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MobileNavComponent],
  templateUrl: './guide-mobile.component.html',
  styleUrls: ['./guide-mobile.component.scss'],
})
export class GuideMobileComponent {
  readonly steps = [
    { icon: 'person_add', title: 'Create your account', text: 'Sign up with your phone number, secure your wallet with a PIN, and verify your identity to start staking.' },
    { icon: 'account_balance_wallet', title: 'Fund your wallet', text: 'Deposit instantly via bank transfer or card. Your balance updates the moment your deposit is confirmed.' },
    { icon: 'sports_soccer', title: 'Pick your game', text: 'Choose a Pod or Match Pool, review the odds, and stake within the range. Cashback pods refund part of your stake if the selection loses.' },
    { icon: 'payments', title: 'Get paid instantly', text: 'Winning selections pay out immediately after settlement. Withdraw to your bank anytime.' },
  ];

  readonly features = [
    { icon: 'emoji_events', title: 'Pods — Pool Betting', color: '#00E676', text: 'Everyone stakes into the same selection pool for better returns. Cashback pods refund a percentage if the selection loses.' },
    { icon: 'groups', title: 'Match Pools', color: '#E8B923', text: 'Team-based pools — back a team to win. The winning team\'s pool splits the pot.' },
    { icon: 'auto_awesome', title: 'Ora AI', color: '#CE93D8', text: 'Our in-house AI curates fixtures, checks settlements against live sports data, and manages your Bet Manager portfolio.' },
    { icon: 'shield', title: 'Bet Manager Tiers', color: '#90CAF9', text: 'Goalkeeper to Striker — four AI-managed risk tiers with a 30-day lock cycle.' },
    { icon: 'autorenew', title: 'Refunds & Cashback', color: '#FFB74D', text: 'Voided matches refund your full stake. Cashback pods return a percentage on a loss.' },
    { icon: 'account_balance', title: 'Instant Withdrawals', color: '#64B5F6', text: 'Withdraw your available balance to your bank in seconds. Failed transfers are auto-refunded.' },
  ];

  readonly facts = [
    'Stakes are settled within minutes of the final whistle.',
    'Each Pod shows its odds and cashback percentage before you stake.',
    'Accumulators combine 2–5 selections into one bet.',
    'Bet Manager funds unlock after the 30-day cycle ends.',
  ];
}
