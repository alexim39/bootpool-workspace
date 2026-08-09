import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BetManagerAccount {
  tier: 'academy' | 'goalkeeper' | 'defender' | 'midfielder' | 'striker' | 'chairman';
  currentValue: number;
  units: number;
  totalDeposited: number;
  totalProfit: number;
}

export interface BetManagerSummary {
  account: any;
  nav: number;
  currentValue: number;
  totalProfit: number;
  lockedBalance: number;
  unlockedBalance: number;
  tier: string;
  tierConfig: { minDeposit: number; platformFee: number; lockDays: number };
}

export interface NavData {
  current: { nav: number; totalValue: number; units: number };
  history: Array<{ cycleNumber: number; startDate: string; endDate: string; startingNav: number; endingNav: number | null; returnPct: number }>;
  daily: Array<{ date: string; nav: number }>;
}

export interface DepositRecord {
  _id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  units: number;
  navAtExecution: number;
  depositedAt: string;
  withdrawableAt: string | null;
  status: 'locked' | 'unlocked' | 'withdrawn';
  reference?: string;
}

export interface PerformanceData {
  currentValue: number;
  totalDeposited: number;
  totalProfit: number;
  returnPct: number;
  cycles: Array<{ cycleNumber: number; startDate: string; endDate: string; returnPct: number; status: string }>;
}

export interface HistoryQuery {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface HistoryPage {
  deposits: DepositRecord[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class BetManagerService {
  private readonly API_URL = environment.apiUrl;

  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('ib_token');
    return { Authorization: `Bearer ${token}` };
  }

  getAccounts(): Observable<{ success: boolean; data: BetManagerAccount[] }> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.get<{ success: boolean; data: BetManagerAccount[] }>(`${this.API_URL}/bet-manager`, { headers: this.getHeaders() });
  }

  getAccount(tier: string): Observable<{ success: boolean; data: BetManagerSummary | null; message?: string }> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.get<{ success: boolean; data: BetManagerSummary | null }>(`${this.API_URL}/bet-manager/${tier}`, { headers: this.getHeaders() });
  }

  getNav(tier: string): Observable<{ success: boolean; data: NavData }> {
    return this.http.get<{ success: boolean; data: NavData }>(`${this.API_URL}/bet-manager/nav/${tier}`, { headers: this.getHeaders() });
  }

  deposit(tier: string, amount: number): Observable<{ success: boolean; message: string }> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/bet-manager/deposit`, { tier, amount }, { headers: this.getHeaders() });
  }

  withdraw(tier: string): Observable<{ success: boolean; message: string }> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/bet-manager/withdraw`, { tier }, { headers: this.getHeaders() });
  }

  getDepositHistory(tier: string, query: HistoryQuery = {}): Observable<{ success: boolean; data: HistoryPage }> {
    let params = new HttpParams();
    const set = (key: string, value: unknown) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    };
    set('page', query.page);
    set('limit', query.limit);
    set('type', query.type);
    set('status', query.status);
    set('from', query.from);
    set('to', query.to);
    set('search', query.search);
    set('sortField', query.sortField);
    set('sortOrder', query.sortOrder);
    return this.http.get<{ success: boolean; data: HistoryPage }>(
      `${this.API_URL}/bet-manager/${tier}/history`, { params, headers: this.getHeaders() }
    );
  }

  getPerformance(tier: string): Observable<{ success: boolean; data: PerformanceData }> {
    return this.http.get<{ success: boolean; data: PerformanceData }>(`${this.API_URL}/bet-manager/${tier}/performance`, { headers: this.getHeaders() });
  }
}
