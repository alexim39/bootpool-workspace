import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export type VirtualGameId = 'coin_flip' | 'dice' | 'color_wheel';

export interface VirtualGame {
  id: VirtualGameId;
  name: string;
  description: string;
  icon: string;
  multiplier: number;
  minStake: number;
  maxStake: number;
  outcomes: string[];
  rtpPercent: number;
  enabled: boolean;
}

export interface PlayResult {
  playId: string;
  game: VirtualGameId;
  choice: string;
  outcome: string;
  result: 'win' | 'loss';
  stakeAmount: number;
  multiplier: number;
  payoutAmount: number;
  seed: string;
  verificationHash: string;
  balanceAfter: number;
  playedAt: string;
}

export interface PlayHistoryItem {
  _id: string;
  game: VirtualGameId;
  stakeAmount: number;
  multiplier: number;
  result: 'win' | 'loss';
  payoutAmount: number;
  outcome: string;
  choice: string;
  playedAt: string;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

@Injectable({ providedIn: 'root' })
export class VirtualGamesService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  catalog = signal<VirtualGame[]>([]);
  history = signal<PlayHistoryItem[]>([]);
  historyTotal = signal(0);
  loading = signal(false);
  historyLoading = signal(false);
  playing = signal(false);
  error = signal<string | null>(null);

  private getHeaders() {
    return { Authorization: `Bearer ${this.auth.token()}` };
  }

  fetchCatalog(onLoaded?: () => void) {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<{ success: boolean; data: VirtualGame[] }>(
      `${environment.apiUrl}/virtual-games/catalog`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.catalog.set(res.data);
          onLoaded?.();
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load virtual games');
        this.loading.set(false);
      }
    });
  }

  play(game: VirtualGameId, choice: string, amount: number, idempotencyKey?: string) {
    this.playing.set(true);
    this.error.set(null);
    return this.http.post<{ success: boolean; data: PlayResult; message?: string }>(
      `${environment.apiUrl}/virtual-games/play`,
      { game, choice, amount, idempotencyKey },
      { headers: this.getHeaders() }
    );
  }

  fetchHistory(page = 1, limit = 20) {
    this.historyLoading.set(true);
    this.http.get<{ success: boolean; data: { items: PlayHistoryItem[]; total: number } }>(
      `${environment.apiUrl}/virtual-games/history?page=${page}&limit=${limit}`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.history.set(res.data.items);
          this.historyTotal.set(res.data.total);
        }
        this.historyLoading.set(false);
      },
      error: () => this.historyLoading.set(false)
    });
  }

  isPlaying() {
    return this.playing();
  }

  donePlaying() {
    this.playing.set(false);
  }

  /**
   * Client-side fairness check: re-derives the outcome from the server seed + play id
   * and confirms the seed hash matches, mirroring the backend's derivation.
   */
  async verifyResult(result: PlayResult, game: VirtualGame): Promise<boolean> {
    try {
      const seedHash = await sha256Hex(result.seed);
      if (seedHash !== result.verificationHash) return false;
      const big = BigInt('0x' + await sha256Hex(`${result.seed}:${result.playId}`));
      const idx = Number(big % BigInt(game.outcomes.length));
      return game.outcomes[idx] === result.outcome;
    } catch {
      return false;
    }
  }
}