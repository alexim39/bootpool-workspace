import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalUsers: number;
  activePods: number;
  totalStakes: number;
  totalVolume: number;
  dailyVolume: { date: string; volume: number }[];
  recentStakes: any[];
  podStatusBreakdown: { status: string; count: number }[];
}

export interface AdminPod {
  id: string;
  _id?: string;
  title: string;
  sport: string;
  league?: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  selection: string;
  gainsMultiplier: number;
  marketOdds?: number;
  refundPercent?: number;
  minStake: number;
  maxStake: number;
  maxTotalExposure: number;
  currentExposure: number;
  currentParticipants: number;
  status: string;
  opensAt?: string;
  stakingClosesAt: string;
  settlementEstimateAt?: string;
  settlementEstimateLabel: string;
  marketType?: string;
  isLive: boolean;
  bookedExternally?: boolean;
  bookedAt?: string;
  bookedBy?: { _id: string; fullName?: string; phone?: string };
  legs: any[];
  metadata?: {
    oraCurated?: boolean;
    oraConfidence?: number;
    fixtureId?: number;
    combined?: boolean;
    legMarkets?: string[];
    legSelections?: string[];
  };
  createdBy?: { _id: string; fullName?: string; phone?: string };
  result?: string;
  homeScore?: number;
  awayScore?: number;
  settlementStatus?: string;
  settlementDisputed?: boolean;
  settlementDisputedReason?: string;
  settlementStuckReason?: string;
  settlementReviewedBy?: string;
  settlementReviewNote?: string;
  settlementReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  _id?: string;
  phone: string;
  fullName: string;
  email?: string;
  isSuspended: boolean;
  kycVerified: boolean;
  role?: string;
  createdAt: string;
  lastLoginAt?: string;
  walletBalance?: number;
}

export interface AdminStake {
  id: string;
  _id?: string;
  userId: string;
  user?: { phone: string; name: string; fullName?: string; email?: string };
  podId: string;
  pod?: any;
  items?: Array<{
    pod: string;
    homeTeam: string;
    awayTeam: string;
    selection: string;
    gainsMultiplier: number;
    matchDate: string;
    status: string;
    settledAt?: string;
  }>;
  combinedMultiplier?: number;
  stakeAmount: number;
  potentialPayout: number;
  netPayout?: number;
  platformFee?: number;
  status: string;
  createdAt: string;
  settledAt?: string;
  isSettled?: boolean;
  isParlay?: boolean;
  settlementNotes?: string;
}

export interface AdminTransaction {
  id: string;
  reference: string;
  userId: string;
  user?: { phone: string; name: string; fullName?: string };
  type: string;
  amount: number;
  fee: number;
  status: string;
  provider?: string;
  completedAt?: string;
  failureReason?: string;
  metadata?: { description?: string; [key: string]: any };
  createdAt: string;
}

export interface AdminLoan {
  _id: string;
  id: string;
  user?: { _id: string; phone: string; fullName: string; email?: string };
  amount: number;
  interestRate: number;
  status: string;
  purpose: string;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: { _id: string; phone: string; fullName: string };
  dueDate?: string;
  repaidAt?: string;
  repaymentAmount?: number;
  note?: string;
  createdAt: string;
}

export interface AdminWithdrawal {
  _id: string;
  id: string;
  reference: string;
  userId: string;
  user?: { phone: string; fullName: string; email?: string };
  amount: number;
  fee: number;
  status: string;
  type: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
  metadata?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    description?: string;
  };
  providerData?: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin`;

  getSports(): Observable<{ success: boolean; data: string[] }> {
    return this.http.get<{ success: boolean; data: string[] }>(`${environment.apiUrl}/pods/sports`);
  }

  getDashboard(): Observable<{ success: boolean; data: DashboardStats }> {
    return this.http.get<{ success: boolean; data: DashboardStats }>(`${this.baseUrl}/dashboard`);
  }

  getPods(params?: { page?: number; limit?: number; status?: string; search?: string; dateFrom?: string; dateTo?: string }): Observable<{ success: boolean; data: PaginatedResponse<AdminPod> }> {
    let hp = new HttpParams();
    if (params?.page) hp = hp.set('page', params.page);
    if (params?.limit) hp = hp.set('limit', params.limit);
    if (params?.status) hp = hp.set('status', params.status);
    if (params?.search) hp = hp.set('search', params.search);
    if (params?.dateFrom) hp = hp.set('dateFrom', params.dateFrom);
    if (params?.dateTo) hp = hp.set('dateTo', params.dateTo);
    return this.http.get<{ success: boolean; data: PaginatedResponse<AdminPod> }>(`${this.baseUrl}/pods`, { params: hp });
  }

  getPod(id: string): Observable<{ success: boolean; data: AdminPod }> {
    return this.http.get<{ success: boolean; data: AdminPod }>(`${this.baseUrl}/pods/${id}`);
  }

  getReserveConsumption(): Observable<{ success: boolean; data: ReserveConsumption }> {
    return this.http.get<{ success: boolean; data: ReserveConsumption }>(`${this.baseUrl}/pods/reserve-consumption`);
  }

  getSettings(): Observable<{ success: boolean; data: { reserveAmount: number } }> {
    return this.http.get<{ success: boolean; data: { reserveAmount: number } }>(`${this.baseUrl}/settings`);
  }

  updateSettings(data: { reserveAmount: number }): Observable<{ success: boolean; data: { reserveAmount: number } }> {
    return this.http.put<{ success: boolean; data: { reserveAmount: number } }>(`${this.baseUrl}/settings`, data);
  }

  createPod(data: Partial<AdminPod>): Observable<{ success: boolean; data: AdminPod }> {
    return this.http.post<{ success: boolean; data: AdminPod }>(`${this.baseUrl}/pods`, data);
  }

  updatePod(id: string, data: Partial<AdminPod>): Observable<{ success: boolean; data: AdminPod }> {
    return this.http.put<{ success: boolean; data: AdminPod }>(`${this.baseUrl}/pods/${id}`, data);
  }

  toggleExternalBooking(id: string): Observable<{ success: boolean; data: AdminPod }> {
    return this.http.post<{ success: boolean; data: AdminPod }>(`${this.baseUrl}/pods/${id}/toggle-external-booking`, {});
  }

  publishPod(id: string): Observable<{ success: boolean; data: AdminPod }> {
    return this.http.post<{ success: boolean; data: AdminPod }>(`${this.baseUrl}/pods/${id}/publish`, {});
  }

  activatePod(id: string): Observable<{ success: boolean; data: AdminPod }> {
    return this.http.post<{ success: boolean; data: AdminPod }>(`${this.baseUrl}/pods/${id}/activate`, {});
  }

  settlePod(id: string, result: string, notes?: string): Observable<{ success: boolean; data: AdminPod }> {
    return this.http.post<{ success: boolean; data: AdminPod }>(`${this.baseUrl}/pods/${id}/settle`, { result, notes });
  }

  syncPods(daysAhead?: number): Observable<{ success: boolean; created: number; skipped: number; details: string[]; errors: string[]; apiLog: string[]; successes: Array<{ fixtureId: number; homeTeam: string; awayTeam: string; pods: number }> }> {
    return this.http.post<{ success: boolean; created: number; skipped: number; details: string[]; errors: string[]; apiLog: string[]; successes: Array<{ fixtureId: number; homeTeam: string; awayTeam: string; pods: number }> }>(`${this.baseUrl}/pods/sync`, { daysAhead });
  }

  cancelPod(id: string): Observable<{ success: boolean; data: AdminPod }> {
    return this.http.post<{ success: boolean; data: AdminPod }>(`${this.baseUrl}/pods/${id}/cancel`, {});
  }

  getUsers(params?: { page?: number; limit?: number; search?: string }): Observable<{ success: boolean; data: PaginatedResponse<AdminUser> }> {
    let hp = new HttpParams();
    if (params?.page) hp = hp.set('page', params.page);
    if (params?.limit) hp = hp.set('limit', params.limit);
    if (params?.search) hp = hp.set('search', params.search);
    return this.http.get<{ success: boolean; data: PaginatedResponse<AdminUser> }>(`${this.baseUrl}/users`, { params: hp });
  }

  getUser(id: string): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.baseUrl}/users/${id}`);
  }

  toggleUserStatus(id: string): Observable<{ success: boolean; data: AdminUser }> {
    return this.http.post<{ success: boolean; data: AdminUser }>(`${this.baseUrl}/users/${id}/toggle-status`, {});
  }

  verifyUserKyc(id: string): Observable<{ success: boolean; data: AdminUser }> {
    return this.http.post<{ success: boolean; data: AdminUser }>(`${this.baseUrl}/users/${id}/verify-kyc`, {});
  }

  rejectUserKyc(id: string, notes: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/users/${id}/reject-kyc`, { notes });
  }

  getWithdrawals(params?: { page?: number; limit?: number; status?: string }): Observable<{ success: boolean; data: PaginatedResponse<AdminWithdrawal> }> {
    let hp = new HttpParams();
    if (params?.page) hp = hp.set('page', params.page);
    if (params?.limit) hp = hp.set('limit', params.limit);
    if (params?.status) hp = hp.set('status', params.status);
    return this.http.get<{ success: boolean; data: PaginatedResponse<AdminWithdrawal> }>(`${this.baseUrl}/withdrawals`, { params: hp });
  }

  getWithdrawal(id: string): Observable<{ success: boolean; data: AdminWithdrawal }> {
    return this.http.get<{ success: boolean; data: AdminWithdrawal }>(`${this.baseUrl}/withdrawals/${id}`);
  }

  approveWithdrawal(id: string): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.baseUrl}/withdrawals/${id}/approve`, {});
  }

  rejectWithdrawal(id: string, reason: string): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.baseUrl}/withdrawals/${id}/reject`, { reason });
  }

  getStakes(params?: { page?: number; limit?: number; status?: string; userId?: string; podId?: string }): Observable<{ success: boolean; data: PaginatedResponse<AdminStake> }> {
    let hp = new HttpParams();
    if (params?.page) hp = hp.set('page', params.page);
    if (params?.limit) hp = hp.set('limit', params.limit);
    if (params?.status) hp = hp.set('status', params.status);
    return this.http.get<{ success: boolean; data: PaginatedResponse<AdminStake> }>(`${this.baseUrl}/stakes`, { params: hp });
  }

  getStake(id: string): Observable<{ success: boolean; data: AdminStake }> {
    return this.http.get<{ success: boolean; data: AdminStake }>(`${this.baseUrl}/stakes/${id}`);
  }

  settleStake(id: string, result: string): Observable<{ success: boolean; data: AdminStake }> {
    return this.http.post<{ success: boolean; data: AdminStake }>(`${this.baseUrl}/stakes/${id}/settle`, { result });
  }

  voidStake(id: string): Observable<{ success: boolean; data: AdminStake }> {
    return this.http.post<{ success: boolean; data: AdminStake }>(`${this.baseUrl}/stakes/${id}/void`, {});
  }

  getLoans(params?: { page?: number; limit?: number; status?: string; userId?: string }): Observable<{ success: boolean; data: PaginatedResponse<AdminLoan> }> {
    let hp = new HttpParams();
    if (params?.page) hp = hp.set('page', params.page);
    if (params?.limit) hp = hp.set('limit', params.limit);
    if (params?.status) hp = hp.set('status', params.status);
    if (params?.userId) hp = hp.set('userId', params.userId);
    return this.http.get<{ success: boolean; data: PaginatedResponse<AdminLoan> }>(`${this.baseUrl}/loans`, { params: hp });
  }

  getLoan(id: string): Observable<{ success: boolean; data: AdminLoan }> {
    return this.http.get<{ success: boolean; data: AdminLoan }>(`${this.baseUrl}/loans/${id}`);
  }

  createLoan(data: { userId: string; amount: number; purpose: string; interestRate?: number; dueDate?: string }): Observable<{ success: boolean; data: AdminLoan }> {
    return this.http.post<{ success: boolean; data: AdminLoan }>(`${this.baseUrl}/loans`, data);
  }

  approveLoan(id: string): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.baseUrl}/loans/${id}/approve`, {});
  }

  rejectLoan(id: string, reason: string): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.baseUrl}/loans/${id}/reject`, { reason });
  }

  repayLoan(id: string): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.baseUrl}/loans/${id}/repay`, {});
  }

  getTransactions(params?: { page?: number; limit?: number; type?: string; status?: string }): Observable<{ success: boolean; data: PaginatedResponse<AdminTransaction> }> {
    let hp = new HttpParams();
    if (params?.page) hp = hp.set('page', params.page);
    if (params?.limit) hp = hp.set('limit', params.limit);
    if (params?.type) hp = hp.set('type', params.type);
    if (params?.status) hp = hp.set('status', params.status);
    return this.http.get<{ success: boolean; data: PaginatedResponse<AdminTransaction> }>(`${this.baseUrl}/transactions`, { params: hp });
  }

  adjustWallet(userId: string, amount: number, type: 'credit' | 'debit', reason: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/wallet/adjust`, { userId, amount, type, reason });
  }

  curatePods(): Observable<CurationResponse> {
    return this.http.post<CurationResponse>(`${this.baseUrl}/ai/curate`, {});
  }

  aiSettleCheck(podId: string): Observable<{ success: boolean; data: SettlementCheckResult }> {
    return this.http.post<{ success: boolean; data: SettlementCheckResult }>(`${this.baseUrl}/pods/${podId}/ai-settle-check`, {});
  }

  aiSettlePod(podId: string, result: string, notes?: string): Observable<{ success: boolean; data: AdminPod; warning?: string; check?: SettlementCheckResult }> {
    return this.http.post<{ success: boolean; data: AdminPod }>(`${this.baseUrl}/pods/${podId}/ai-settle`, { result, notes });
  }

  aiSettleAll(): Observable<{ success: boolean; settled: number; disputed: number; stuck: number; errors: string[]; results: SettlementCheckResult[] }> {
    return this.http.post<{ success: boolean; settled: number; disputed: number; stuck: number; errors: string[]; results: SettlementCheckResult[] }>(`${this.baseUrl}/ai/settle-all`, {});
  }

  listDisputedSettlements(): Observable<{ success: boolean; data: AdminPod[]; count: number }> {
    return this.http.get<{ success: boolean; data: AdminPod[]; count: number }>(`${this.baseUrl}/ai/settlement/disputed`);
  }

  resolveDispute(podId: string, result: string, reviewNote: string): Observable<{ success: boolean; data: AdminPod }> {
    return this.http.post<{ success: boolean; data: AdminPod }>(`${this.baseUrl}/ai/settlement/disputed/${podId}/resolve`, { result, reviewNote });
  }

  batchResolveDisputes(podIds: string[], result: string, reviewNote: string): Observable<{ success: boolean; resolved: number; errors: string[] }> {
    return this.http.post<{ success: boolean; resolved: number; errors: string[] }>(`${this.baseUrl}/ai/settlement/disputed/batch-resolve`, { podIds, result, reviewNote });
  }

  listStuckPods(): Observable<{ success: boolean; data: AdminPod[]; count: number }> {
    return this.http.get<{ success: boolean; data: AdminPod[]; count: number }>(`${this.baseUrl}/ai/settlement/stuck`);
  }

  getPendingReviewCount(): Observable<{ success: boolean; data: { disputed: number; stuck: number } }> {
    return this.http.get<{ success: boolean; data: { disputed: number; stuck: number } }>(`${this.baseUrl}/ai/settlement/pending-count`);
  }

  aiKycReview(userId: string): Observable<{ success: boolean; data: KycReviewResult }> {
    return this.http.post<{ success: boolean; data: KycReviewResult }>(`${this.baseUrl}/ai/kyc-review/${userId}`, {});
  }

  aiKycApprove(userId: string): Observable<{ success: boolean; data: AdminUser }> {
    return this.http.post<{ success: boolean; data: AdminUser }>(`${this.baseUrl}/ai/kyc-approve/${userId}`, {});
  }

  aiKycReject(userId: string, notes: string): Observable<{ success: boolean; data: AdminUser }> {
    return this.http.post<{ success: boolean; data: AdminUser }>(`${this.baseUrl}/ai/kyc-reject/${userId}`, { notes });
  }

  aiKycReviewAll(): Observable<{ success: boolean; reviewed: number; approved: number; rejected: number; manual: number; results: KycReviewResult[]; errors: string[] }> {
    return this.http.post<{ success: boolean; reviewed: number; approved: number; rejected: number; manual: number; results: KycReviewResult[]; errors: string[] }>(`${this.baseUrl}/ai/kyc-review-all`, {});
  }

  getRiskReport(): Observable<{ success: boolean; data: RiskReport }> {
    return this.http.get<{ success: boolean; data: RiskReport }>(`${this.baseUrl}/ai/risk-report`);
  }

  applyAutoCaps(): Observable<{ success: boolean; adjusted: number; details: Array<{ podId: string; title: string; oldMax: number; newMax: number }> }> {
    return this.http.post<{ success: boolean; adjusted: number; details: Array<{ podId: string; title: string; oldMax: number; newMax: number }> }>(`${this.baseUrl}/ai/risk-auto-cap`, {});
  }

  restoreCaps(): Observable<{ success: boolean; restored: number; details: Array<{ podId: string; title: string; oldMax: number; newMax: number }> }> {
    return this.http.post<{ success: boolean; restored: number; details: Array<{ podId: string; title: string; oldMax: number; newMax: number }> }>(`${this.baseUrl}/ai/risk-restore-caps`, {});
  }

  runRiskEscalation(): Observable<{ success: boolean; data: { autoCapAdjusted: number; podsSuspended: number; creationFrozen: boolean; warnings: string[]; escalationLevel: string } }> {
    return this.http.post<{ success: boolean; data: { autoCapAdjusted: number; podsSuspended: number; creationFrozen: boolean; warnings: string[]; escalationLevel: string } }>(`${this.baseUrl}/ai/risk-run-escalation`, {});
  }

  getRiskEscalationState(): Observable<{ success: boolean; data: EscalationState }> {
    return this.http.get<{ success: boolean; data: EscalationState }>(`${this.baseUrl}/ai/risk-escalation-state`);
  }

  getBIReport(days?: number): Observable<{ success: boolean; data: BIReport }> {
    const params = days ? new HttpParams().set('days', days) : undefined;
    return this.http.get<{ success: boolean; data: BIReport }>(`${this.baseUrl}/ai/bi-report`, { params });
  }

  getBIForecast(days?: number): Observable<{ success: boolean; data: BIForecast }> {
    const params = days ? new HttpParams().set('days', days) : undefined;
    return this.http.get<{ success: boolean; data: BIForecast }>(`${this.baseUrl}/ai/bi-forecast`, { params });
  }

  getT4Advisory(): Observable<{ success: boolean; data: T4Advisory }> {
    return this.http.get<{ success: boolean; data: T4Advisory }>(`${this.baseUrl}/ai/bi-t4-advisory`);
  }

  getCampaignSegments(): Observable<{ success: boolean; data: { segments: Record<string, CampaignUser[]>; counts: Record<string, number> } }> {
    return this.http.get<{ success: boolean; data: { segments: Record<string, CampaignUser[]>; counts: Record<string, number> } }>(`${this.baseUrl}/ai/campaigns/segments`);
  }

  generateCampaign(segment: string, maxUsers?: number): Observable<{ success: boolean; data: CampaignResult }> {
    return this.http.post<{ success: boolean; data: CampaignResult }>(`${this.baseUrl}/ai/campaigns/generate`, { segment, maxUsers });
  }

  sendCampaign(messages: CampaignMessage[], channels?: string[]): Observable<{ success: boolean; sent: number; failed: number }> {
    return this.http.post<{ success: boolean; sent: number; failed: number }>(`${this.baseUrl}/ai/campaigns/send`, { messages, channels });
  }

  getFeaturedBanners(): Observable<{ success: boolean; data: FeaturedBanner[] }> {
    return this.http.get<{ success: boolean; data: FeaturedBanner[] }>(`${this.baseUrl}/featured-games`);
  }

  createFeaturedBanner(data: Partial<FeaturedBanner>): Observable<{ success: boolean; data: FeaturedBanner }> {
    return this.http.post<{ success: boolean; data: FeaturedBanner }>(`${this.baseUrl}/featured-games`, data);
  }

  updateFeaturedBanner(id: string, data: Partial<FeaturedBanner>): Observable<{ success: boolean; data: FeaturedBanner }> {
    return this.http.put<{ success: boolean; data: FeaturedBanner }>(`${this.baseUrl}/featured-games/${id}`, data);
  }

  deleteFeaturedBanner(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/featured-games/${id}`);
  }

  generateBannerDescription(title: string, subtitle?: string): Observable<{ success: boolean; data: { description: string } }> {
    return this.http.post<{ success: boolean; data: { description: string } }>(`${this.baseUrl}/featured-games/generate-description`, { title, subtitle });
  }

  getChatStats(): Observable<{ success: boolean; data: ChatStats }> {
    return this.http.get<{ success: boolean; data: ChatStats }>(`${this.baseUrl}/chat/stats`);
  }

  getChatSessions(params?: { page?: number; limit?: number; status?: string; search?: string }): Observable<{ success: boolean; data: ChatSessionListResponse }> {
    let hp = new HttpParams();
    if (params?.page) hp = hp.set('page', params.page);
    if (params?.limit) hp = hp.set('limit', params.limit);
    if (params?.status) hp = hp.set('status', params.status);
    if (params?.search) hp = hp.set('search', params.search);
    return this.http.get<{ success: boolean; data: ChatSessionListResponse }>(`${this.baseUrl}/chat/sessions`, { params: hp });
  }

  getChatSession(id: string): Observable<{ success: boolean; data: ChatSessionDetail }> {
    return this.http.get<{ success: boolean; data: ChatSessionDetail }>(`${this.baseUrl}/chat/sessions/${id}`);
  }

  resolveChatSession(id: string): Observable<{ success: boolean; data: any }> {
    return this.http.put<{ success: boolean; data: any }>(`${this.baseUrl}/chat/sessions/${id}/resolve`, {});
  }
}

export interface CampaignUser {
  userId: string; phone: string; fullName: string; email?: string;
  segment: string; daysSinceLastActivity: number; totalStaked: number;
  lastStakeAmount: number; lastSport?: string; lastLeague?: string;
  activeStakes: number; winRate: number; walletBalance: number;
}

export interface CampaignMessage {
  userId: string; phone: string; email?: string; fullName: string;
  segment: string; subject: string; inAppTitle: string;
  inAppMessage: string; smsText: string; emailHtml: string;
}

export interface CampaignResult {
  segment: string; total: number; sent: number;
  errors: string[]; messages: CampaignMessage[];
}

export interface BIBySport {
  sport: string; stakes: number; volume: number; revenue: number; payouts: number; profit: number;
}
export interface BIByLeague {
  league: string; stakes: number; volume: number; revenue: number; payouts: number; profit: number;
}
export interface BITopPod {
  title: string; sport: string; stakes: number; volume: number; profit: number;
}
export interface BITopUser {
  phone: string; totalStaked: number; totalWon: number; stakeCount: number;
}
export interface BIRreportOverview {
  totalRevenue: number; totalPayouts: number; netProfit: number;
  totalStakes: number; totalVolume: number; totalUsers: number; newUsers: number;
  churnedUsers: number; activeUsers: number;
}
export interface BIRevenueBreakdown {
  commissionFees: number; cashoutFees: number; totalRevenue: number;
}
export interface BIUserMetrics {
  total: number; newLastPeriod: number; kycVerified: number; kycRate: number;
  totalDeposits: number; totalWithdrawals: number; netDeposits: number;
}
export interface BIMonthOverMonth {
  stakesChange: number; volumeChange: number; revenueChange: number; usersChange: number;
}
export interface BIReport {
  period: string; dateFrom: string; dateTo: string;
  overview: BIRreportOverview;
  bySport: BIBySport[];
  byLeague: BIByLeague[];
  revenueBreakdown: BIRevenueBreakdown;
  userMetrics: BIUserMetrics;
  topPods: BITopPod[];
  topUsers: BITopUser[];
  monthOverMonth: BIMonthOverMonth;
  aiInsight: string;
}

export interface PodRisk {
  podId: string;
  title: string;
  sport: string;
  selection: string;
  gainsMultiplier: number;
  currentExposure: number;
  maxStake: number;
  maxTotalExposure: number;
  potentialPayout: number;
  exposurePercent: number;
  participantCount: number;
  status: string;
  suggestedMaxStake: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskSuspended: boolean;
}

export interface ReserveProjection {
  totalReserves: number;
  totalLocked: number;
  netAvailableReserves: number;
  totalPotentialPayout: number;
  projectedReserveNeeded: number;
  reserveDeficit: number;
  reserveDeficitPercent: number;
  historicalWinRate: number;
  historicalLossRate: number;
  recentTrend: 'improving' | 'stable' | 'deteriorating';
  trendDescription: string;
  suggestedTopUp: number;
}

export interface EscalationState {
  creationFrozen: boolean;
  podsSuspended: number;
  autoCapActive: boolean;
  autoCapAppliedCount: number;
  escalationLevel: 'none' | 'caution' | 'warning' | 'critical';
  frozenAt: string | null;
  lastEscalationCheck: string;
}

export interface RiskReport {
  timestamp: string;
  totalReserves: number;
  totalExposure: number;
  totalLocked: number;
  totalPotentialPayout: number;
  riskRatio: number;
  riskRatioPercent: number;
  riskLevel: 'low' | 'medium' | 'high';
  activePodsCount: number;
  activeUsersCount: number;
  podsAtRisk: PodRisk[];
  warnings: string[];
  recommendations: string[];
  autoCapActive: boolean;
  autoCapThreshold: number;
  reserveProjection: ReserveProjection;
  escalation: EscalationState;
}

export interface ForecastMetric {
  current: number;
  previous: number;
  changePercent: number;
  projectedNext: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface BIForecast {
  period: string;
  days: number;
  forecastDate: string;
  revenue: ForecastMetric;
  stakes: ForecastMetric;
  volume: ForecastMetric;
  newUsers: ForecastMetric;
  netProfit: ForecastMetric;
  summary: string;
}

export interface T4AdvisoryMetric {
  value: number;
  status: 'good' | 'warning' | 'critical';
}

export interface T4Advisory {
  timestamp: string;
  healthScore: number;
  healthLabel: 'good' | 'fair' | 'needs_attention' | 'critical';
  metrics: {
    profitMargin: T4AdvisoryMetric;
    userGrowth: T4AdvisoryMetric;
    kycRate: T4AdvisoryMetric;
    netDeposits: T4AdvisoryMetric;
    churnRate: T4AdvisoryMetric;
    revenueTrend: T4AdvisoryMetric;
  };
  warnings: string[];
  recommendations: string[];
  previousHealthScore: number;
  healthChange: 'improving' | 'stable' | 'deteriorating';
}

export interface KycReviewResult {
  userId: string;
  fullName: string;
  phone: string;
  kycType: string | null;
  registeredName: string;
  verifiedName: string | null;
  namesMatch: boolean;
  duplicateBvnNin: boolean;
  duplicateAccountCount: number;
  accountAgeDays: number;
  hasStakes: boolean;
  totalStakeVolume: number;
  recommendedAction: 'approve' | 'reject' | 'manual_review';
  confidence: number;
  riskFlags: string[];
  reasoning: string;
}

export interface SettlementCheckResult {
  podId: string;
  title: string;
  fixtureId: number | null;
  matchFound: boolean;
  matchStatus: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  actualResult: string;
  podSelection: string;
  recommendedResult: string;
  confidence: number;
  reasoning: string;
  disputed: boolean;
  disputeReason?: string;
}

export interface ReserveConsumption {
  reserveAmount: number;
  activePodsCount: number;
  totalExposure: number;
  refundIfAllLose: number;
  payoutIfAllWin: number;
  netIfAllWin: number;
  netIfAllLose: number;
  consumptionPercent: number;
  pods: Array<{
    id: string;
    title: string;
    exposure: number;
    refundPercent: number;
    gainsMultiplier: number;
    refundIfLoss: number;
    payoutIfWin: number;
  }>;
}

export interface CurationSelection {
  selection: string;
  confidence: number;
  recommendedMultiplier: number;
  reasoning: string;
}

export interface CurationCombinedLeg {
  marketType: string;
  selection: string;
  multiplier: number;
}

export interface CurationFixture {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  verdict: 'RECOMMEND' | 'SKIP';
  overallReasoning: string;
  recommendations: CurationSelection[];
  multiplier?: number;
  selection?: string;
  isCombined?: boolean;
  combinedLegs?: CurationCombinedLeg[];
}

export interface CurationResponse {
  success: boolean;
  total: number;
  recommended: number;
  skipped: number;
  fixtures: CurationFixture[];
  errors: string[];
  apiLog: string[];
  skippedReason: string | null;
  oraWinRate: number;
  oraTotalPods: number;
  oraWon: number;
  confidenceThreshold: number;
}

export interface FeaturedBanner {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
  ctaLabel: string;
  ctaLink: string;
  emoji: string;
  gradientStart: string;
  gradientEnd: string;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  displayOrder: number;
  createdBy?: { phone: string; fullName: string };
  createdAt: string;
  updatedAt: string;
}

export interface ChatStats {
  total: number;
  active: number;
  escalated: number;
  resolved: number;
}

export interface ChatSessionSummary {
  _id: string;
  user: { _id: string; fullName?: string; phone?: string; email?: string; photo?: string };
  status: 'active' | 'escalated' | 'resolved';
  messageCount: number;
  lastMessage: string;
  lastActivity: string;
  escalatedAt?: string;
  escalationReason?: string;
  escalatedNotified?: boolean;
  createdAt: string;
}

export interface ChatSessionListResponse {
  sessions: ChatSessionSummary[];
  total: number;
  page: number;
  pages: number;
}

export interface ChatSessionDetail {
  _id: string;
  user: { _id: string; fullName?: string; phone?: string; email?: string; photo?: string };
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
  status: 'active' | 'escalated' | 'resolved';
  escalatedAt?: string;
  escalationReason?: string;
  escalatedNotified?: boolean;
  createdAt: string;
  updatedAt: string;
}
