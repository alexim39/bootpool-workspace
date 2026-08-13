import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface FaqItem { question: string; answer: string; open: boolean; }

@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './faq-section.component.html',
  styleUrls: ['./faq-section.component.scss']
})
export class FaqSectionComponent {
  items: FaqItem[] = [
    { question: 'How does BetPool make money if it refunds losses?', answer: 'BetPool earns a 30% commission on gains from winning pods. When you win, BetPool takes 30% of your profit before crediting your wallet. Additionally, a 10% fee is charged on early cashouts. The entire model depends on curating pods with strong enough odds that overall wins exceed the cost of refunds.', open: false },
    { question: 'Is my stake protected if a pod loses?', answer: 'Yes — every pod carries cashback on losses. If a pod doesn\'t win, a percentage of your stake is automatically refunded to your wallet. The rate depends on the pod\'s odds and is shown on the pod card before you stake: from 5% on higher-odds pods up to 35% on the safest offers. Refunds are paid from BetPool\'s reserves.', open: false },
    { question: 'Is BetPool gambling?', answer: 'BetPool offers sports prediction pools with a safety net. Unlike traditional betting where you can lose everything, BetPool refunds a percentage of your stake if the pod does not win. This means you only ever risk a fraction of your capital. It is designed as a lower-risk way to engage with sports predictions.', open: false },
    { question: 'Why can\'t I place any bet I want?', answer: 'Unlike traditional sportsbooks where you pick your own bets, BetPool\'s experts curate each pod using deep knowledge, AI analysis, and professional betting experience. This curation is what makes the refund model possible — we only list pods where the odds are in our users\' favour.', open: false },
    { question: 'How fast can I withdraw?', answer: 'Withdrawals are processed within 1-2 business days to your Nigerian bank account. KYC-verified users have higher withdrawal limits. Minimum withdrawal is ₦500.', open: false },
    { question: 'What is a pod?', answer: 'A pod is a curated betting pool on BetPool. Each pod bundles one or more sporting events into a single betting unit with a fixed payout multiplier. You stake on the pod as a whole, not on individual matches.', open: false },
    { question: 'How do deposits work?', answer: 'Deposits are processed instantly via Paystack. You can fund your wallet from the Wallet page with amounts from ₦500 to ₦500,000. Zero fees on deposits.', open: false },
    { question: 'What is KYC and why do I need it?', answer: 'KYC (Know Your Customer) verification is required to unlock higher withdrawal limits. Submit your BVN or NIN from your Profile page under Security. Your information is encrypted and securely stored.', open: false },
    { question: 'What about accumulator bets — is my stake protected if a leg fails?', answer: 'Accumulators (2+ selections) are not covered by the pod cashback, but slips with 4 or more selections come with one-leg insurance: if exactly one selection fails while the rest win, the slip still pays a reduced accumulator on the winning selections (voided selections are excluded and don\'t count as the failing leg). Every accumulator slip is covered by this rule automatically — no extra fee.', open: false },
    { question: 'How does the referral program work?', answer: 'Share your unique referral code with friends. When they sign up and place their first bet on any product (Pods, Bet Manager, or Match Pools), you earn a ₦500 bonus. Your code and stats are on your Profile page.', open: false }
  ];
  toggle(item: FaqItem) { item.open = !item.open; }
}
