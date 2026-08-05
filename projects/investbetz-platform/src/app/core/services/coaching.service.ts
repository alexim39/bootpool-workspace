import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export type RiskLevel = 'ok' | 'caution' | 'high';

export interface CoachingInsights {
  bankroll: number;
  staked24h: number;
  stakes24h: number;
  lossStreak: number;
  winRate30d: number | null;
  riskLevel: RiskLevel;
  nudges: string[];
  tip: string;
}

@Injectable({ providedIn: 'root' })
export class CoachingService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  insights = signal<CoachingInsights | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private getHeaders() {
    return { Authorization: `Bearer ${this.auth.token()}` };
  }

  fetchInsights() {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<{ success: boolean; data: CoachingInsights }>(
      `${environment.apiUrl}/coaching/insights`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        if (res.success) this.insights.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load coaching insights');
        this.loading.set(false);
      }
    });
  }
}
