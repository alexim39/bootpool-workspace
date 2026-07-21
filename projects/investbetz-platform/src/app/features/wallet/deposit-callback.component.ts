import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-deposit-callback',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="callback-page">
      <div class="callback-card">
        @if (status() === 'verifying') {
          <div class="callback-spinner"></div>
          <h2>Verifying Payment</h2>
          <p>Please wait while we confirm your deposit...</p>
        } @else if (status() === 'success') {
          <div class="callback-icon success">✓</div>
          <h2>Deposit Successful</h2>
          <p>{{ message() }}</p>
          <p class="callback-redirect">Redirecting to wallet...</p>
          <a routerLink="/wallet" class="callback-btn">Go to Wallet</a>
        } @else if (status() === 'error') {
          <div class="callback-icon error">✕</div>
          <h2>Deposit Failed</h2>
          <p>{{ message() }}</p>
          <a routerLink="/wallet" class="callback-btn">Back to Wallet</a>
        }
      </div>
    </div>
  `,
  styles: [`
    .callback-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0A1428;
      padding: 24px;
    }
    .callback-card {
      text-align: center;
      background: #0D1A30;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 48px 32px;
      max-width: 400px;
      width: 100%;
    }
    .callback-card h2 {
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 700;
      color: #FFFFFF;
    }
    .callback-card p {
      margin: 0;
      font-size: 14px;
      color: rgba(255,255,255,0.55);
      line-height: 1.5;
    }
    .callback-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 700;
      margin: 0 auto 20px;
    }
    .callback-icon.success {
      background: rgba(0,230,118,0.15);
      color: #00E676;
    }
    .callback-icon.error {
      background: rgba(244,67,54,0.15);
      color: #f44336;
    }
    .callback-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(0,230,118,0.15);
      border-top-color: #00E676;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .callback-redirect {
      margin-top: 16px !important;
      font-size: 12px !important;
      color: rgba(255,255,255,0.35) !important;
    }
    .callback-btn {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 32px;
      background: linear-gradient(135deg, #00E676, #00C853);
      border-radius: 10px;
      color: #0A1428;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .callback-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(0,230,118,0.25);
    }
  `]
})
export class DepositCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  status = signal<'verifying' | 'success' | 'error'>('verifying');
  message = signal('Verifying your payment...');

  ngOnInit() {
    const params = this.route.snapshot.queryParams;
    const reference = params['ref'] || params['trxref'] || params['reference'];
    if (!reference) {
      this.status.set('error');
      this.message.set('No payment reference found.');
      return;
    }

    const token = localStorage.getItem('ib_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    this.http.get<{ success: boolean; message: string }>(
      `${environment.apiUrl}/wallet/deposit/callback?reference=${encodeURIComponent(reference)}`,
      { headers }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.status.set('success');
          this.message.set(res.message || 'Funds credited to your wallet.');
          setTimeout(() => this.router.navigate(['/wallet']), 3000);
        } else {
          this.status.set('error');
          this.message.set(res.message || 'Payment verification failed.');
        }
      },
      error: (err) => {
        this.status.set('error');
        this.message.set(err.error?.message || 'Verification failed. Contact support.');
      }
    });
  }
}
