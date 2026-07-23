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
    { question: 'Is my stake guaranteed to be refunded?', answer: 'Yes. If a pod does not win, you get your full stake back. BetPool absorbs the loss from its reserves. There are no conditions or fine print — if the pod loses, you are refunded in full.', open: false },
    { question: 'Is BetPool gambling?', answer: 'BetPool offers sports prediction pools with a safety net. Unlike traditional betting where you can lose everything, BetPool refunds your stake if the pod does not win. This means you only ever risk the opportunity cost, not your capital. It is designed as a lower-risk way to engage with sports predictions.', open: false },
    { question: 'Why can\'t I place any bet I want?', answer: 'Unlike traditional sportsbooks where you pick your own bets, BetPool\'s experts curate each pod using deep knowledge, AI analysis, and professional betting experience. This curation is what makes the refund model possible — we only list pods where the odds are in our users\' favour.', open: false },
    { question: 'How fast can I withdraw?', answer: 'Withdrawals are processed within 1-2 business days to your Nigerian bank account. KYC-verified users have higher withdrawal limits. Minimum withdrawal is ₦500.', open: false },
    { question: 'What is a pod?', answer: 'A pod is a curated betting pool on BetPool. Each pod bundles one or more sporting events into a single betting unit with a fixed payout multiplier. You stake on the pod as a whole, not on individual matches.', open: false },
    { question: 'How do deposits work?', answer: 'Deposits are processed instantly via Paystack. You can fund your wallet from the Wallet page with amounts from ₦500 to ₦500,000. Zero fees on deposits.', open: false },
    { question: 'What is KYC and why do I need it?', answer: 'KYC (Know Your Customer) verification is required to unlock higher withdrawal limits. Submit your BVN or NIN from your Profile page under Security. Your information is encrypted and securely stored.', open: false },
    { question: 'How does the referral program work?', answer: 'Share your unique referral code with friends. When they sign up and place a bet, you earn referral bonuses. Your code and stats are on your Profile page.', open: false }
  ];
  toggle(item: FaqItem) { item.open = !item.open; }
}
