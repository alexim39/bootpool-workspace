import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AdminVirtualGameId = 'coin_flip' | 'dice' | 'color_wheel';

export interface AdminVirtualGameSummary {
  game: AdminVirtualGameId;
  name: string;
  icon: string;
  multiplier: number;
  plays: number;
  staked: number;
  wins: number;
  payout: number;
  winRate: number;
  today: { plays: number; staked: number; won: number };
}

export interface AdminVirtualGamesAgg {
  games: AdminVirtualGameSummary[];
  totals: {
    plays: number;
    staked: number;
    wins: number;
    payout: number;
    winRate: number;
    today: { plays: number; staked: number; won: number };
  };
  bestWin: { amount: number; game: string } | null;
}

@Injectable({ providedIn: 'root' })
export class AdminVirtualGamesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin/virtual-games`;

  getSummary(params?: { from?: string; to?: string }): Observable<{ success: boolean; data: AdminVirtualGamesAgg }> {
    let hp = new HttpParams();
    if (params?.from) hp = hp.set('from', params.from);
    if (params?.to) hp = hp.set('to', params.to);
    return this.http.get<any>(`${this.baseUrl}/summary`, { params: hp });
  }
}