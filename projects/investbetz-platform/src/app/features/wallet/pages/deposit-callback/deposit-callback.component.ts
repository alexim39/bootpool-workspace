import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-deposit-callback',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './deposit-callback.component.html',
  styleUrls: ['./deposit-callback.component.scss']
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
