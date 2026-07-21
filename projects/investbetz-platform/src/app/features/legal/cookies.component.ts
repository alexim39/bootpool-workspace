import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-cookies',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div class="legal-page">
      <div class="legal-header">
        <a routerLink="/" class="legal-back"><mat-icon>arrow_back</mat-icon> Back to Home</a>
        <h1>Cookie Policy</h1>
        <p class="legal-date">Last updated: July 2026</p>
      </div>
      <div class="legal-content">
        <section>
          <h2>1. What Are Cookies?</h2>
          <p>Cookies are small text files stored on your device by your web browser when you visit a website. They help websites remember your preferences, login status, and other information to improve your browsing experience.</p>
        </section>
        <section>
          <h2>2. How BetPool Uses Cookies</h2>
          <p>We use cookies for the following purposes: <strong>Authentication</strong> — to keep you logged in and secure your session; <strong>Preferences</strong> — to remember your settings and display choices; <strong>Analytics</strong> — to understand how users interact with our platform so we can improve it.</p>
        </section>
        <section>
          <h2>3. Types of Cookies We Use</h2>
          <p><strong>Essential Cookies:</strong> Required for the platform to function. These include session tokens and security cookies. They cannot be disabled.<br><br>
          <strong>Functional Cookies:</strong> Remember your preferences, such as language and display settings.<br><br>
          <strong>Analytics Cookies:</strong> Help us understand usage patterns. We use aggregated data only; no personal information is collected via analytics cookies.</p>
        </section>
        <section>
          <h2>4. Third-Party Cookies</h2>
          <p>We use <strong>Paystack</strong> for payment processing, which may set cookies necessary to process transactions securely. Paystack's use of cookies is governed by their own privacy and cookie policies. We do not control third-party cookies.</p>
        </section>
        <section>
          <h2>5. Managing Cookies</h2>
          <p>You can control and manage cookies through your browser settings. Most browsers allow you to block or delete cookies. Note that blocking essential cookies may prevent BetPool from functioning properly. Instructions for managing cookies are available in your browser's help section.</p>
        </section>
        <section>
          <h2>6. Contact</h2>
          <p>If you have questions about our use of cookies, contact us at <a href="mailto:support&#64;betpool.tech">support&#64;betpool.tech</a>.</p>
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
export class CookiesComponent {}
