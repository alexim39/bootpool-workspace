import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OraLeagueStat {
  league: string;
  played: number;
  won: number;
  winRate: number;
  sample: 'sufficient' | 'low';
}

export interface OraRecord {
  byLeague: OraLeagueStat[];
  overall: { played: number; won: number; winRate: number } | null;
  settledPots30d: number;
  avgSettlementMs: number | null;
  payouts30d: number;
  avgPayoutMs: number | null;
  payoutRatio30d: number | null;
  sampledAt: string;
  signature: string;
  signatureAlgo: string;
}

@Injectable({ providedIn: 'root' })
export class OraRecordService {
  constructor(private http: HttpClient) {}

  getRecord(league = '', limit = 20, refresh = false): Observable<{ success: boolean; data: OraRecord }> {
    let params = new HttpParams().set('limit', String(limit));
    if (league.trim()) params = params.set('league', league.trim());
    if (refresh) params = params.set('refresh', 'true');
    return this.http.get<{ success: boolean; data: OraRecord }>(`${environment.apiUrl}/ora-record`, { params });
  }
}
