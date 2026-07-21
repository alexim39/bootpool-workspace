import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  _id: string;
  user: string;
  type: 'deposit' | 'withdrawal' | 'stake' | 'payout' | 'referral' | 'kyc' | 'auth' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: AppNotification[];
    total: number;
    unreadCount: number;
    page: number;
    pages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly API_URL = environment.apiUrl;

  notifications = signal<AppNotification[]>([]);
  unreadCount = signal(0);
  total = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);

  hasUnread = computed(() => this.unreadCount() > 0);

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('ib_token');
    return { Authorization: `Bearer ${token}` };
  }

  fetchNotifications(page = 1, limit = 20): Observable<NotificationsResponse> {
    this.loading.set(true);
    this.error.set(null);

    return new Observable(observer => {
      this.http.get<NotificationsResponse>(
        `${this.API_URL}/notifications?page=${page}&limit=${limit}`,
        { headers: this.getHeaders() }
      ).subscribe({
        next: (res) => {
          if (res.success) {
            if (page === 1) this.notifications.set(res.data.notifications);
            else this.notifications.update(n => [...n, ...res.data.notifications]);
            this.unreadCount.set(res.data.unreadCount);
            this.total.set(res.data.total);
          }
          this.loading.set(false);
          observer.next(res);
          observer.complete();
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to fetch notifications');
          this.loading.set(false);
          observer.error(err);
        }
      });
    });
  }

  markAsRead(id: string): Observable<any> {
    return this.http.put<any>(
      `${this.API_URL}/notifications/${id}/read`,
      {},
      { headers: this.getHeaders() }
    );
  }

  markAsUnread(id: string): Observable<any> {
    return this.http.put<any>(
      `${this.API_URL}/notifications/${id}/unread`,
      {},
      { headers: this.getHeaders() }
    );
  }

  deleteNotification(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.API_URL}/notifications/${id}`,
      { headers: this.getHeaders() }
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.put<any>(
      `${this.API_URL}/notifications/read-all`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getNotificationIcon(type: AppNotification['type']): string {
    const icons: Record<AppNotification['type'], string> = {
      deposit: 'account_balance_wallet',
      withdrawal: 'money_off',
      stake: 'sports_esports',
      payout: 'emoji_events',
      referral: 'group_add',
      kyc: 'verified_user',
      auth: 'security',
      system: 'notifications'
    };
    return icons[type] || 'notifications';
  }

  getNotificationColor(type: AppNotification['type']): string {
    const colors: Record<AppNotification['type'], string> = {
      deposit: '#4caf50',
      withdrawal: '#ff9800',
      stake: '#2196f3',
      payout: '#4caf50',
      referral: '#9c27b0',
      kyc: '#00bcd4',
      auth: '#e91e63',
      system: '#9e9e9e'
    };
    return colors[type] || '#9e9e9e';
  }

  timeAgo(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = Math.max(0, Math.floor((now - date) / 1000));

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
