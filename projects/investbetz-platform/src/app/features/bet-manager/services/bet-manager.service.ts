import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BetManagerAccount {
  tier: 'defender' | 'midfielder' | 'striker';
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
}

export interface PerformanceData {
  currentValue: number;
  totalDeposited: number;
  totalProfit: number;
  returnPct: number;
  cycles: Array<{ cycleNumber: number; startDate: string; endDate: string; returnPct: number; status: string }>;
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
    return this.http.get<{ success: boolean; data: NavData }>(`${this.API_URL}/bet-manager/nav/${tier}`);
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

  getDepositHistory(tier: string, page = 1, limit = 20): Observable<{ success: boolean; data: { deposits: DepositRecord[]; total: number } }> {
    return this.http.get<{ success: boolean; data: { deposits: DepositRecord[]; total: number } }>(
      `${this.API_URL}/bet-manager/${tier}/history?page=${page}&limit=${limit}`, { headers: this.getHeaders() }
    );
  }

  getPerformance(tier: string): Observable<{ success: boolean; data: PerformanceData }> {
    return this.http.get<{ success: boolean; data: PerformanceData }>(`${this.API_URL}/bet-manager/${tier}/performance`, { headers: this.getHeaders() });
  }
}
