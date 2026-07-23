import { Injectable, inject, signal, computed } from '@angular/core';
import { AdminService, DashboardStats, RiskReport, BIForecast, T4Advisory } from '../../services';

export interface T4MetricItem {
  label: string;
  value: number;
  status: string;
  display: string;
}

export interface StatCard {
  icon: string;
  iconBg: string;
  label: string;
  value: number;
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardStore {
  private admin = inject(AdminService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly dailyVolume = signal<{ date: string; volume: number }[]>([]);
  readonly recentStakes = signal<any[]>([]);
  readonly podStatusBreakdown = signal<{ status: string; count: number }[]>([]);
  readonly maxVolume = signal(1);
  readonly riskReport = signal<RiskReport | null>(null);
  readonly forecast = signal<BIForecast | null>(null);
  readonly t4Advisory = signal<T4Advisory | null>(null);
  readonly capping = signal(false);
  readonly restoring = signal(false);
  readonly escalating = signal(false);
  readonly t4MetricList = signal<T4MetricItem[]>([]);
  readonly statCards = signal<StatCard[]>([]);

  readonly stakeColumns = ['user', 'pod', 'amount', 'status'];
  readonly riskColumns = ['title', 'exposure', 'risk', 'payout'];

  readonly maxBarVolume = computed(() => {
    const vols = this.dailyVolume().map(d => d.volume);
    return Math.max(...vols, 1);
  });

  init() {
    this.admin.getDashboard().subscribe(res => {
      if (res.success) {
        this.stats.set(res.data);
        this.dailyVolume.set(res.data.dailyVolume || []);
        this.recentStakes.set(res.data.recentStakes || []);
        this.podStatusBreakdown.set(res.data.podStatusBreakdown || []);
        this.maxVolume.set(Math.max(...(res.data.dailyVolume || []).map(d => d.volume), 1));
        this.statCards.set([
          { icon: 'people', iconBg: 'rgba(0,230,118,0.15)', label: 'Total Users', value: res.data.totalUsers },
          { icon: 'sports_esports', iconBg: 'rgba(232,185,35,0.15)', label: 'Active Pods', value: res.data.activePods },
          { icon: 'casino', iconBg: 'rgba(0,230,118,0.15)', label: 'Total Stakes', value: res.data.totalStakes },
          { icon: 'account_balance', iconBg: 'rgba(232,185,35,0.15)', label: 'Volume (NGN)', value: res.data.totalVolume },
        ]);
      }
    });
    this.loadRiskReport();
    this.loadForecast();
    this.loadT4Advisory();
  }

  loadForecast() {
    this.admin.getBIForecast(30).subscribe(res => {
      if (res.success) this.forecast.set(res.data);
    });
  }

  loadT4Advisory() {
    this.admin.getT4Advisory().subscribe(res => {
      if (res.success) {
        this.t4Advisory.set(res.data);
        this.t4MetricList.set([
          { label: 'Profit Margin', value: res.data.metrics.profitMargin.value, status: res.data.metrics.profitMargin.status, display: res.data.metrics.profitMargin.value + '%' },
          { label: 'User Growth', value: res.data.metrics.userGrowth.value, status: res.data.metrics.userGrowth.status, display: res.data.metrics.userGrowth.value + '%' },
          { label: 'KYC Rate', value: res.data.metrics.kycRate.value, status: res.data.metrics.kycRate.status, display: res.data.metrics.kycRate.value + '%' },
          { label: 'Net Deposits', value: res.data.metrics.netDeposits.value, status: res.data.metrics.netDeposits.status, display: '\u20A6' + Math.abs(res.data.metrics.netDeposits.value).toLocaleString() },
          { label: 'Churn Rate', value: res.data.metrics.churnRate.value, status: res.data.metrics.churnRate.status, display: res.data.metrics.churnRate.value + '%' },
          { label: 'Revenue Trend', value: res.data.metrics.revenueTrend.value, status: res.data.metrics.revenueTrend.status, display: (res.data.metrics.revenueTrend.value >= 0 ? '+' : '') + res.data.metrics.revenueTrend.value + '%' },
        ]);
      }
    });
  }

  loadRiskReport() {
    this.admin.getRiskReport().subscribe(res => {
      if (res.success) this.riskReport.set(res.data);
    });
  }

  applyCaps() {
    this.capping.set(true);
    this.admin.applyAutoCaps().subscribe(res => {
      this.capping.set(false);
      if (res.success && res.adjusted > 0) this.loadRiskReport();
    });
  }

  restoreCaps() {
    this.restoring.set(true);
    this.admin.restoreCaps().subscribe(res => {
      this.restoring.set(false);
      if (res.success) this.loadRiskReport();
    });
  }

  runEscalation() {
    this.escalating.set(true);
    this.admin.runRiskEscalation().subscribe(res => {
      this.escalating.set(false);
      if (res.success) this.loadRiskReport();
    });
  }
}
