import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface FaqItem { question: string; answer: string; open: boolean; }

@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="faq-section">
      <h2 class="faq-title">Frequently Asked Questions</h2>
      @for (item of items; track item.question) {
        <div class="faq-item" [class.open]="item.open">
          <button class="faq-question" (click)="toggle(item)">
            <span>{{ item.question }}</span>
            <mat-icon>{{ item.open ? 'remove' : 'add' }}</mat-icon>
          </button>
          @if (item.open) {
            <div class="faq-answer">{{ item.answer }}</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .faq-section { max-width: 720px; margin: 0 auto; padding: 24px 0; }
    .faq-title { font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 16px; }
    .faq-item { background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-bottom: 8px; overflow: hidden; }
    .faq-question { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: none; border: none; color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 500; cursor: pointer; text-align: left; font-family: inherit; transition: color 0.15s; }
    .faq-question:hover { color: #00E676; }
    .faq-question mat-icon { font-size: 20px; width: 20px; height: 20px; color: rgba(255,255,255,0.3); flex-shrink: 0; margin-left: 12px; }
    .open .faq-question mat-icon { color: #00E676; }
    .faq-answer { padding: 0 16px 14px; font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.55); }
  `]
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
