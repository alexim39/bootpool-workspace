import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LoyaltySnapshot {
  tier: LoyaltyTier;
  points: number;
  currentStreak: number;
  lossStreak: number;
  totalStaked: number;
  nextTier: LoyaltyTier | null;
  progressPct: number;
  cashbackTotal: number;
  cashbackPercent: number;
  cashbackLossStreak: number;
}

@Injectable({ providedIn: 'root' })
export class LoyaltyService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  snapshot = signal<LoyaltySnapshot | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private getHeaders() {
    return { Authorization: `Bearer ${this.auth.token()}` };
  }

  fetchSnapshot() {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<{ success: boolean; data: LoyaltySnapshot }>(
      `${environment.apiUrl}/loyalty/snapshot`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        if (res.success) this.snapshot.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load loyalty snapshot');
        this.loading.set(false);
      }
    });
  }
}
