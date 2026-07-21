import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div class="legal-page">
      <div class="legal-header">
        <a routerLink="/" class="legal-back"><mat-icon>arrow_back</mat-icon> Back to Home</a>
        <h1>Terms of Service</h1>
        <p class="legal-date">Last updated: July 2026</p>
      </div>
      <div class="legal-content">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By creating an account and using BetPool, you agree to these Terms of Service. If you do not agree, do not use the platform.</p>
        </section>
        <section>
          <h2>2. Eligibility</h2>
          <p>You must be at least 18 years old to use BetPool. You are responsible for ensuring compliance with local laws regarding online betting and gaming in your jurisdiction.</p>
        </section>
        <section>
          <h2>3. Account Registration</h2>
          <p>You must provide accurate information during registration. You are responsible for maintaining the confidentiality of your PIN and account credentials. BetPool is not liable for unauthorized access due to shared credentials.</p>
        </section>
        <section>
          <h2>4. Deposits and Withdrawals</h2>
          <p>All deposits are processed via Paystack. Withdrawals are sent to your linked Nigerian bank account within 1-2 business days. BetPool reserves the right to verify your identity (KYC) before processing withdrawals above standard limits.</p>
        </section>
        <section>
          <h2>5. Pods and Stakes</h2>
          <p>Pods are curated betting pools. Staking on a pod means you agree to the pod's terms, including its multiplier and settlement rules. If a pod loses, your stake is refunded in full. If it wins, gains are credited after BetPool's 30% commission.</p>
        </section>
        <section>
          <h2>6. Early Cashout</h2>
          <p>Early cashout is available on active stakes at BetPool's discretion. A 10% fee applies to the stake amount. Cashout may be disabled on certain pods.</p>
        </section>
        <section>
          <h2>7. Referral Program</h2>
          <p>Referral bonuses are credited at BetPool's discretion. BetPool reserves the right to void referrals obtained through fraudulent or abusive means.</p>
        </section>
        <section>
          <h2>8. Limitation of Liability</h2>
          <p>BetPool is provided "as is." To the maximum extent permitted by law, BetPool disclaims all warranties and is not liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
        </section>
        <section>
          <h2>9. Changes to Terms</h2>
          <p>BetPool may update these terms at any time. Continued use after changes constitutes acceptance of the new terms.</p>
        </section>
        <section>
          <h2>10. Contact</h2>
          <p>For questions about these terms, contact us at <a href="mailto:support&#64;betpool.tech">support&#64;betpool.tech</a>.</p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .legal-page { min-height: 100vh; background: #0A1428; color: #fff; padding: 0 16px 60px; }
    .legal-header { max-width: 720px; margin: 0 auto; padding: 24px 0 16px; }
    .legal-back { display: inline-flex; align-items: center; gap: 4px; color: rgba(255,255,255,0.4); text-decoration: none; font-size: 13px; margin-bottom: 16px; }
    .legal-back:hover { color: #00E676; }
    .legal-back mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .legal-header h1 { font-size: 28px; font-weight: 800; margin: 0 0 4px; }
    .legal-date { font-size: 13px; color: rgba(255,255,255,0.3); margin: 0; }
    .legal-content { max-width: 720px; margin: 0 auto; }
    .legal-content section { margin-bottom: 24px; }
    .legal-content h2 { font-size: 18px; font-weight: 600; color: #00E676; margin: 0 0 8px; }
    .legal-content p { font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.6); margin: 0; }
    .legal-content a { color: #00E676; }
  `]
})
export class TermsComponent {}
