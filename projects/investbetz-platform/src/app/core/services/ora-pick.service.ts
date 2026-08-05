import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface OraPick {
  podId: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  pick: string;
  gainsMultiplier: number;
  confidence: number;
  whyRecommended?: string;
}

@Injectable({ providedIn: 'root' })
export class OraPickService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  pick = signal<OraPick | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  loaded = signal(false);

  private getHeaders() {
    return { Authorization: `Bearer ${this.auth.token()}` };
  }

  fetchPick(force = false) {
    if (this.loaded() && !force) return;
    this.loading.set(true);
    this.error.set(null);

    this.http.get<{ success: boolean; data: OraPick }>(
      `${environment.apiUrl}/ora/pick-of-day`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        if (res.success) this.pick.set(res.data);
        else this.error.set(res.success ? null : 'No pick available');
        this.loading.set(false);
        this.loaded.set(true);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load pick of the day');
        this.loading.set(false);
        this.loaded.set(true);
      }
    });
  }
}
