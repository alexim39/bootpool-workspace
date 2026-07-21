import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WalletBalance {
  balance: number;
  locked: number;
  available: number;
  currency: string;
  totalDeposited?: number;
  totalWithdrawn?: number;
  totalStaked?: number;
  totalWon?: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'stake' | 'payout' | 'refund' | 'bonus' | 'fee';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'reversed';
  amount: number;
  fee: number;
  netAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  reference: string;
  providerRef?: string;
  provider?: 'paystack' | 'bank_transfer' | 'internal';
  description?: string;
  metadata?: Record<string, any>;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  createdAt: string;
}

export interface TransactionHistoryResponse {
  success: boolean;
  data: {
    transactions: Transaction[];
    total: number;
  };
}

export interface DepositInitResponse {
  success: boolean;
  message?: string;
  reference?: string;
  authorizationUrl?: string;
}

export interface WithdrawalInitResponse {
  success: boolean;
  message?: string;
  reference?: string;
}

export interface Bank {
  code: string;
  name: string;
}

export interface AccountResolution {
  accountName: string;
}

export interface WithdrawalLimits {
  min: number;
  max: number;
  dailyLimit: number;
  fee: string;
}

export interface SavedBankAccount {
  _id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly API_URL = environment.apiUrl;

  balance = signal<WalletBalance>({ balance: 0, locked: 0, available: 0, currency: 'NGN' });
  transactions = signal<Transaction[]>([]);
  loading = signal(false);
  loadingMore = signal(false);
  error = signal<string | null>(null);
  totalTransactions = signal(0);
  currentPage = signal(1);
  hasMore = computed(() => this.transactions().length < this.totalTransactions());

  banks = signal<Bank[]>([]);
  withdrawalLimits = signal<WithdrawalLimits>({
    min: 500,
    max: 5_000_000,
    dailyLimit: 10_000_000,
    fee: '1.5% (max ₦50)'
  });

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('ib_token');
    return { Authorization: `Bearer ${token}` };
  }

  fetchBalance() {
    this.http.get<{ success: boolean; data: WalletBalance }>(`${this.API_URL}/wallet/balance`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        if (res.success) this.balance.set(res.data);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to fetch balance');
      }
    });
  }

  fetchTransactions(page = 1, limit = 20, filters: { type?: string; status?: string } = {}): Observable<TransactionHistoryResponse> {
    if (page === 1) this.loading.set(true);
    else this.loadingMore.set(true);
    this.error.set(null);

    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(filters.type && { type: filters.type }),
      ...(filters.status && { status: filters.status })
    });

    return new Observable(observer => {
      this.http.get<TransactionHistoryResponse>(`${this.API_URL}/wallet/transactions?${query}`, {
        headers: this.getHeaders()
      }).subscribe({
        next: (res) => {
          if (res.success) {
            if (page === 1) this.transactions.set(res.data.transactions);
            else this.transactions.update(t => [...t, ...res.data.transactions]);
            this.totalTransactions.set(res.data.total);
            this.currentPage.set(page);
          }
          this.loading.set(false);
          this.loadingMore.set(false);
          observer.next(res);
          observer.complete();
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to fetch transactions');
          this.loading.set(false);
          this.loadingMore.set(false);
          observer.error(err);
        }
      });
    });
  }

  loadMoreTransactions(filters: { type?: string; status?: string } = {}) {
    if (this.hasMore() && !this.loadingMore()) {
      this.fetchTransactions(this.currentPage() + 1, 20, filters);
    }
  }

  recoverPendingDeposits(): Observable<{ success: boolean; data: { recovered: number; message: string } }> {
    this.loading.set(true);
    return this.http.post<{ success: boolean; data: { recovered: number; message: string } }>(
      `${this.API_URL}/wallet/deposit/recover`,
      {},
      { headers: this.getHeaders() }
    );
  }

  initiateDeposit(amount: number, provider: 'paystack' = 'paystack') {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<DepositInitResponse>(`${this.API_URL}/wallet/deposit`, 
      { amount, provider },
      { headers: this.getHeaders() }
    );
  }

  initiateWithdrawal(data: { 
    amount: number; 
    bankCode: string; 
    accountNumber: string; 
    accountName: string;
    pin: string;
    narration?: string;
  }) {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<WithdrawalInitResponse>(`${this.API_URL}/wallet/withdraw`, data, {
      headers: this.getHeaders()
    });
  }

  fetchBanks() {
    this.http.get<{ success: boolean; data: Bank[] }>(`${this.API_URL}/wallet/banks`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        if (res.success) this.banks.set(res.data);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to fetch banks');
      }
    });
  }

  resolveAccount(accountNumber: string, bankCode: string) {
    return this.http.get<{ success: boolean; data: AccountResolution }>(
      `${this.API_URL}/wallet/resolve-account?accountNumber=${accountNumber}&bankCode=${bankCode}`,
      { headers: this.getHeaders() }
    );
  }

  fetchWithdrawalLimits() {
    this.http.get<{ success: boolean; data: WithdrawalLimits }>(`${this.API_URL}/wallet/limits`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        if (res.success) this.withdrawalLimits.set(res.data);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to fetch withdrawal limits');
      }
    });
  }

  getSavedAccounts(): Observable<{ success: boolean; data: SavedBankAccount[] }> {
    return this.http.get<{ success: boolean; data: SavedBankAccount[] }>(
      `${this.API_URL}/wallet/saved-accounts`,
      { headers: this.getHeaders() }
    );
  }

  saveAccount(data: { bankCode: string; accountNumber: string; accountName: string; bankName: string }): Observable<{ success: boolean; data: SavedBankAccount }> {
    return this.http.post<{ success: boolean; data: SavedBankAccount }>(
      `${this.API_URL}/wallet/save-account`,
      data,
      { headers: this.getHeaders() }
    );
  }

  deleteSavedAccount(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.API_URL}/wallet/saved-accounts/${id}`,
      { headers: this.getHeaders() }
    );
  }

  setDefaultAccount(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.API_URL}/wallet/saved-accounts/${id}/default`,
      {},
      { headers: this.getHeaders() }
    );
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getTransactionIcon(type: Transaction['type']): string {
    const icons: Record<Transaction['type'], string> = {
      deposit: 'account_balance_wallet',
      withdrawal: 'money_off',
      stake: 'casino',
      payout: 'emoji_events',
      refund: 'undo',
      bonus: 'card_giftcard',
      fee: 'receipt_long'
    };
    return icons[type] || 'help';
  }

  getTransactionColor(type: Transaction['type']): string {
    const colors: Record<Transaction['type'], string> = {
      deposit: '#4caf50',
      withdrawal: '#f44336',
      stake: '#ff9800',
      payout: '#4caf50',
      refund: '#2196f3',
      bonus: '#9c27b0',
      fee: '#795548'
    };
    return colors[type] || '#9e9e9e';
  }

  getStatusBadgeClass(status: Transaction['status']): string {
    const classes: Record<Transaction['status'], string> = {
      pending: 'bg-warning text-dark',
      processing: 'bg-info text-dark',
      completed: 'bg-success',
      failed: 'bg-danger',
      cancelled: 'bg-secondary',
      reversed: 'bg-warning text-dark'
    };
    return classes[status] || 'bg-secondary';
  }
}