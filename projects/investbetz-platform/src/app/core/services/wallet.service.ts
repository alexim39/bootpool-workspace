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
  _id?: string;
  type: 'deposit' | 'withdrawal' | 'stake' | 'payout' | 'refund' | 'bonus' | 'fee' | 'transfer';
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
    page: number;
    limit: number;
  };
}

export interface WalletHistoryQuery {
  type?: string;
  status?: string;
  search?: string;
  from?: string;
  to?: string;
  sortField?: 'createdAt' | 'amount' | 'type' | 'status';
  sortOrder?: 'asc' | 'desc';
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

export interface RecipientMatch {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
}

export type TransferDirection = 'sent' | 'received';

export interface TransferRecord {
  id: string;
  reference: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  direction: TransferDirection;
  counterpartyId: string;
  counterpartyName: string;
  counterpartyPhone: string;
  narration?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TransferHistoryResponse {
  success: boolean;
  data: {
    transfers: TransferRecord[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface TransferQuery {
  direction?: TransferDirection;
  status?: string;
  search?: string;
  from?: string;
  to?: string;
  sortField?: 'createdAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface TransferInitResponse {
  success: boolean;
  message?: string;
  reference?: string;
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
    this.loading.set(true);
    this.error.set(null);
    this.http.get<{ success: boolean; data: WalletBalance }>(`${this.API_URL}/wallet/balance`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        if (res.success) this.balance.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to fetch balance');
        this.loading.set(false);
      }
    });
  }

  fetchTransactions(page = 1, limit = 25, filters: WalletHistoryQuery = {}): Observable<TransactionHistoryResponse> {
    if (page === 1) this.loading.set(true);
    else this.loadingMore.set(true);
    this.error.set(null);

    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(filters.type && { type: filters.type }),
      ...(filters.status && { status: filters.status }),
      ...(filters.search && { search: filters.search }),
      ...(filters.from && { from: filters.from }),
      ...(filters.to && { to: filters.to }),
      ...(filters.sortField && { sortField: filters.sortField }),
      ...(filters.sortOrder && { sortOrder: filters.sortOrder })
    });

    return new Observable(observer => {
      this.http.get<TransactionHistoryResponse>(`${this.API_URL}/wallet/transactions?${query}`, {
        headers: this.getHeaders()
      }).subscribe({
        next: (res) => {
          if (res.success) {
            const rows = (res.data.transactions || []).map(t => ({ ...t, id: t.id || String(t._id) }));
            if (page === 1) this.transactions.set(rows);
            else this.transactions.update(t => [...t, ...rows]);
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
    bankName?: string;
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
        this.error.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to fetch banks');
      }
    });
  }

  resolveAccount(accountNumber: string, bankCode: string) {
    return this.http.get<{ success: boolean; data?: AccountResolution; message?: string }>(
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

  resolveRecipient(q: string): Observable<{ success: boolean; data: RecipientMatch[] }> {
    return this.http.get<{ success: boolean; data: RecipientMatch[] }>(
      `${this.API_URL}/wallet/transfer/resolve?q=${encodeURIComponent(q)}`,
      { headers: this.getHeaders() }
    );
  }

  initiateTransfer(data: {
    recipientId: string;
    amount: number;
    pin: string;
    narration?: string;
  }): Observable<TransferInitResponse> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<TransferInitResponse>(`${this.API_URL}/wallet/transfer`, data, {
      headers: this.getHeaders()
    });
  }

  fetchTransfers(page = 1, limit = 25, filters: TransferQuery = {}): Observable<TransferHistoryResponse> {
    if (page === 1) this.loading.set(true);
    else this.loadingMore.set(true);
    this.error.set(null);

    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(filters.direction && { direction: filters.direction }),
      ...(filters.status && { status: filters.status }),
      ...(filters.search && { search: filters.search }),
      ...(filters.from && { from: filters.from }),
      ...(filters.to && { to: filters.to }),
      ...(filters.sortField && { sortField: filters.sortField }),
      ...(filters.sortOrder && { sortOrder: filters.sortOrder })
    });

    return new Observable(observer => {
      this.http.get<TransferHistoryResponse>(`${this.API_URL}/wallet/transfers?${query}`, {
        headers: this.getHeaders()
      }).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.loadingMore.set(false);
          observer.next(res);
          observer.complete();
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to fetch transfers');
          this.loading.set(false);
          this.loadingMore.set(false);
          observer.error(err);
        }
      });
    });
  }

  exportTransfersCsv(filters: TransferQuery = {}): Observable<Blob> {
    const query = new URLSearchParams({
      ...(filters.direction && { direction: filters.direction }),
      ...(filters.status && { status: filters.status }),
      ...(filters.search && { search: filters.search }),
      ...(filters.from && { from: filters.from }),
      ...(filters.to && { to: filters.to }),
      ...(filters.sortField && { sortField: filters.sortField }),
      ...(filters.sortOrder && { sortOrder: filters.sortOrder })
    });
    return this.http.get(`${this.API_URL}/wallet/transfers/export?${query}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
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
      fee: 'receipt_long',
      transfer: 'swap_horiz'
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
      fee: '#795548',
      transfer: '#00B8D9'
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