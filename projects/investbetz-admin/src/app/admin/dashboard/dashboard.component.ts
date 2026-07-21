import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { AdminService, DashboardStats, RiskReport, PodRisk, BIForecast, T4Advisory } from '../services/admin.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, DecimalPipe, SlicePipe, MatCardModule, MatTableModule, MatIconModule, MatButtonModule, MatTooltipModule, RouterLink],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <h1>Dashboard</h1>
      </div>

      <div class="stat-cards">
        <div class="stat-card" *ngFor="let stat of statCards">
          <div class="stat-icon" [style.background]="stat.iconBg">
            <mat-icon>{{ stat.icon }}</mat-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stat.value | number }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>

      <div class="charts-row">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Daily Volume (7 days)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="bar-chart">
              <div class="bar-item" *ngFor="let d of dailyVolume">
                <div class="bar-label">{{ d.date | slice:5:10 }}</div>
                <div class="bar-track">
                  <div class="bar-fill" [style.height.%]="barHeight(d.volume)"></div>
                </div>
                <div class="bar-value">{{ d.volume | number }}</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Pod Status Breakdown</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="status-list">
              <div class="status-item" *ngFor="let s of podStatusBreakdown">
                <div class="status-label">
                  <span class="status-dot" [style.background]="statusColor(s.status)"></span>
                  <span>{{ s.status }}</span>
                </div>
                <div class="status-bar-track">
                  <div class="status-bar-fill" [style.width.%]="statusPercent(s.count)" [style.background]="statusColor(s.status)"></div>
                </div>
                <span class="status-count">{{ s.count }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="charts-row">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Recent Stakes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="recentStakes" class="admin-table">
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef>User</th>
                <td mat-cell *matCellDef="let s">{{ s.user?.fullName || s.user?.phone || 'N/A' }}</td>
              </ng-container>
              <ng-container matColumnDef="pod">
                <th mat-header-cell *matHeaderCellDef>Pod</th>
                <td mat-cell *matCellDef="let s">{{ s.podId?.title || 'N/A' }}</td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let s">\u20A6{{ s.stakeAmount | number }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let s">
                  <span class="chip" [style.background]="stakeStatusColor(s.status)">{{ s.status }}</span>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="stakeColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: stakeColumns;"></tr>
            </table>
            <div class="empty-state" *ngIf="recentStakes.length === 0">No recent stakes</div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="forecast-row" *ngIf="forecast">
        <mat-card class="forecast-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon style="vertical-align:middle;margin-right:6px;color:#CE93D8">trending_up</mat-icon>
              Ora Financial Forecast
              <span class="forecast-badge" [style.background]="forecast.revenue.changePercent >= 0 ? 'rgba(0,230,118,0.2)' : 'rgba(244,67,54,0.2)'"
                    [style.color]="forecast.revenue.changePercent >= 0 ? '#00E676' : '#f44336'">
                Next {{ forecast.days }} days
              </span>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="forecast-summary">{{ forecast.summary }}</div>
            <div class="forecast-grid">
              <div class="forecast-item">
                <span class="f-label">Revenue</span>
                <span class="f-current">\u20A6{{ forecast.revenue.current | number }}</span>
                <span class="f-arrow" [style.color]="forecast.revenue.changePercent >= 0 ? '#00E676' : '#f44336'">
                  {{ forecast.revenue.changePercent >= 0 ? '↑' : '↓' }} {{ Math.abs(forecast.revenue.changePercent) }}%
                </span>
                <span class="f-next">→ \u20A6{{ forecast.revenue.projectedNext | number }}</span>
                <span class="f-confidence" [style.color]="forecast.revenue.confidence === 'high' ? '#00E676' : forecast.revenue.confidence === 'medium' ? '#E8B923' : '#f44336'">
                  {{ forecast.revenue.confidence }}
                </span>
              </div>
              <div class="forecast-item">
                <span class="f-label">Stakes</span>
                <span class="f-current">{{ forecast.stakes.current | number }}</span>
                <span class="f-arrow" [style.color]="forecast.stakes.changePercent >= 0 ? '#00E676' : '#f44336'">
                  {{ forecast.stakes.changePercent >= 0 ? '↑' : '↓' }} {{ Math.abs(forecast.stakes.changePercent) }}%
                </span>
                <span class="f-next">→ {{ forecast.stakes.projectedNext | number }}</span>
                <span class="f-confidence" [style.color]="forecast.stakes.confidence === 'high' ? '#00E676' : forecast.stakes.confidence === 'medium' ? '#E8B923' : '#f44336'">
                  {{ forecast.stakes.confidence }}
                </span>
              </div>
              <div class="forecast-item">
                <span class="f-label">New Users</span>
                <span class="f-current">{{ forecast.newUsers.current | number }}</span>
                <span class="f-arrow" [style.color]="forecast.newUsers.changePercent >= 0 ? '#00E676' : '#f44336'">
                  {{ forecast.newUsers.changePercent >= 0 ? '↑' : '↓' }} {{ Math.abs(forecast.newUsers.changePercent) }}%
                </span>
                <span class="f-next">→ {{ forecast.newUsers.projectedNext | number }}</span>
                <span class="f-confidence" [style.color]="forecast.newUsers.confidence === 'high' ? '#00E676' : forecast.newUsers.confidence === 'medium' ? '#E8B923' : '#f44336'">
                  {{ forecast.newUsers.confidence }}
                </span>
              </div>
              <div class="forecast-item">
                <span class="f-label">Net Profit</span>
                <span class="f-current" [style.color]="forecast.netProfit.current >= 0 ? '#00E676' : '#f44336'">\u20A6{{ forecast.netProfit.current | number }}</span>
                <span class="f-arrow" [style.color]="forecast.netProfit.changePercent >= 0 ? '#00E676' : '#f44336'">
                  {{ forecast.netProfit.changePercent >= 0 ? '↑' : '↓' }} {{ Math.abs(forecast.netProfit.changePercent) }}%
                </span>
                <span class="f-next">→ \u20A6{{ forecast.netProfit.projectedNext | number }}</span>
                <span class="f-confidence" [style.color]="forecast.netProfit.confidence === 'high' ? '#00E676' : forecast.netProfit.confidence === 'medium' ? '#E8B923' : '#f44336'">
                  {{ forecast.netProfit.confidence }}
                </span>
              </div>
            </div>
            <div class="forecast-footer">
              <a routerLink="/admin/bi-reports" class="forecast-link">View Full BI Reports →</a>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="t4-card" *ngIf="t4Advisory">
        <mat-card-header>
          <mat-card-title>
            <mat-icon style="vertical-align:middle;margin-right:6px;color:#CE93D8">monitor_heart</mat-icon>
            T4 Financial Health Advisory
          </mat-card-title>
          <div class="t4-header-actions">
            <button mat-stroked-button class="btn-refresh-risk" (click)="loadT4Advisory()">
              <mat-icon>refresh</mat-icon> Refresh
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          <div class="t4-score-row">
            <div class="t4-gauge">
              <div class="t4-gauge-value" [style.color]="t4ScoreColor(t4Advisory.healthLabel)">{{ t4Advisory.healthScore }}%</div>
              <div class="t4-gauge-label">Health Score</div>
              <div class="t4-gauge-bar">
                <div class="t4-gauge-fill" [style.width.%]="t4Advisory.healthScore" [style.background]="t4ScoreColor(t4Advisory.healthLabel)"></div>
              </div>
              <div class="t4-gauge-level" [style.color]="t4ScoreColor(t4Advisory.healthLabel)">
                {{ t4Advisory.healthLabel === 'needs_attention' ? 'NEEDS ATTENTION' : t4Advisory.healthLabel.toUpperCase() }}
              </div>
              <div class="t4-change" [style.color]="t4Advisory.healthChange === 'improving' ? '#00E676' : t4Advisory.healthChange === 'deteriorating' ? '#f44336' : '#E8B923'">
                {{ t4Advisory.healthChange === 'improving' ? '↑ Improving' : t4Advisory.healthChange === 'deteriorating' ? '↓ Deteriorating' : '→ Stable' }}
              </div>
            </div>
            <div class="t4-metrics">
              <div class="t4-metric" *ngFor="let m of t4MetricList">
                <span class="t4-metric-label">{{ m.label }}</span>
                <span class="t4-metric-value" [style.color]="m.status === 'good' ? '#00E676' : m.status === 'warning' ? '#E8B923' : '#f44336'">
                  {{ m.display }}
                </span>
                <span class="t4-metric-dot" [style.background]="m.status === 'good' ? '#00E676' : m.status === 'warning' ? '#E8B923' : '#f44336'"></span>
              </div>
            </div>
          </div>

          <div class="t4-warnings" *ngIf="t4Advisory.warnings.length">
            <div class="t4-section-title">Warnings</div>
            <div class="t4-warning" *ngFor="let w of t4Advisory.warnings">
              <mat-icon style="font-size:14px;color:#E8B923">warning_amber</mat-icon>
              <span>{{ w }}</span>
            </div>
          </div>
          <div class="t4-recommendations" *ngIf="t4Advisory.recommendations.length">
            <div class="t4-section-title">Recommendations</div>
            <div class="t4-rec" *ngFor="let r of t4Advisory.recommendations">
              <mat-icon style="font-size:14px;color:#CE93D8">auto_awesome</mat-icon>
              <span>{{ r }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="risk-card" *ngIf="riskReport">
        <mat-card-header>
          <mat-card-title>
            <mat-icon style="vertical-align:middle;margin-right:6px;color:#CE93D8">shield</mat-icon>
            Ora Risk Dashboard
          </mat-card-title>
          <div class="risk-header-actions">
            <button mat-stroked-button class="btn-refresh-risk" (click)="loadRiskReport()">
              <mat-icon>refresh</mat-icon> Refresh
            </button>
            <button mat-stroked-button class="btn-auto-cap" (click)="applyCaps()" [disabled]="capping">
              <mat-icon>auto_awesome</mat-icon>
              {{ capping ? 'Applying...' : 'Apply Auto-Caps' }}
            </button>
            <button mat-stroked-button class="btn-restore-caps" (click)="restoreCaps()" [disabled]="restoring">
              <mat-icon>restart_alt</mat-icon>
              {{ restoring ? 'Restoring...' : 'Restore Caps' }}
            </button>
            <button mat-stroked-button class="btn-run-escalation" (click)="runEscalation()" [disabled]="escalating">
              <mat-icon>play_arrow</mat-icon>
              {{ escalating ? 'Running...' : 'Run Escalation Check' }}
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          <div class="risk-meter-row">
            <div class="risk-gauge">
              <div class="gauge-value" [style.color]="riskColor(riskReport.riskLevel)">{{ riskReport.riskRatioPercent }}%</div>
              <div class="gauge-label">Risk Ratio</div>
              <div class="gauge-bar">
                <div class="gauge-fill" [style.width.%]="Math.min(riskReport.riskRatioPercent, 100)" [style.background]="riskColor(riskReport.riskLevel)"></div>
              </div>
              <div class="gauge-level" [style.color]="riskColor(riskReport.riskLevel)">
                {{ riskReport.riskLevel === 'high' ? 'HIGH RISK' : riskReport.riskLevel === 'medium' ? 'MEDIUM RISK' : 'LOW RISK' }}
              </div>
            </div>
            <div class="risk-metrics">
              <div class="metric"><span class="metric-label">Total Reserves</span><span class="metric-value">\u20A6{{ riskReport.totalReserves | number }}</span></div>
              <div class="metric"><span class="metric-label">Total Exposure</span><span class="metric-value">\u20A6{{ riskReport.totalExposure | number }}</span></div>
              <div class="metric"><span class="metric-label">Potential Payout</span><span class="metric-value">\u20A6{{ riskReport.totalPotentialPayout | number }}</span></div>
              <div class="metric"><span class="metric-label">Active Pods</span><span class="metric-value">{{ riskReport.activePodsCount }}</span></div>
              <div class="metric"><span class="metric-label">Active Users</span><span class="metric-value">{{ riskReport.activeUsersCount }}</span></div>
              <div class="metric"><span class="metric-label">Auto-Cap</span><span class="metric-value" [style.color]="riskReport.autoCapActive ? '#E8B923' : '#00E676'">{{ riskReport.autoCapActive ? 'ACTIVE' : 'Inactive' }}</span></div>
            </div>
          </div>

          <div class="reserve-section" *ngIf="riskReport.reserveProjection">
            <div class="risk-section-title">Reserve Projection</div>
            <div class="reserve-grid">
              <div class="reserve-item">
                <span class="reserve-label">Net Available Reserves</span>
                <span class="reserve-value">\u20A6{{ riskReport.reserveProjection.netAvailableReserves | number }}</span>
              </div>
              <div class="reserve-item">
                <span class="reserve-label">Projected Reserve Needed</span>
                <span class="reserve-value">\u20A6{{ riskReport.reserveProjection.projectedReserveNeeded | number }}</span>
              </div>
              <div class="reserve-item">
                <span class="reserve-label">Reserve Deficit</span>
                <span class="reserve-value" [style.color]="riskReport.reserveProjection.reserveDeficit > 0 ? '#f44336' : '#00E676'">
                  {{ riskReport.reserveProjection.reserveDeficit > 0 ? '\u20A6' + (riskReport.reserveProjection.reserveDeficit | number) : 'None' }}
                </span>
              </div>
              <div class="reserve-item">
                <span class="reserve-label">Coverage Ratio</span>
                <span class="reserve-value" [style.color]="riskReport.reserveProjection.reserveDeficitPercent > 20 ? '#f44336' : '#00E676'">
                  {{ 100 - riskReport.reserveProjection.reserveDeficitPercent }}%
                </span>
              </div>
              <div class="reserve-item">
                <span class="reserve-label">Suggested Top-Up</span>
                <span class="reserve-value" *ngIf="riskReport.reserveProjection.suggestedTopUp > 0">\u20A6{{ riskReport.reserveProjection.suggestedTopUp | number }}</span>
                <span class="reserve-value" *ngIf="riskReport.reserveProjection.suggestedTopUp === 0" style="color:#00E676">None needed</span>
              </div>
              <div class="reserve-item">
                <span class="reserve-label">Historical Win Rate</span>
                <span class="reserve-value">{{ riskReport.reserveProjection.historicalWinRate }}%</span>
              </div>
              <div class="reserve-item">
                <span class="reserve-label">Trend</span>
                <span class="reserve-value" [style.color]="riskReport.reserveProjection.recentTrend === 'deteriorating' ? '#f44336' : riskReport.reserveProjection.recentTrend === 'improving' ? '#00E676' : '#E8B923'">
                  {{ riskReport.reserveProjection.recentTrend }}
                </span>
              </div>
            </div>
            <div class="reserve-trend-note" *ngIf="riskReport.reserveProjection.trendDescription">
              {{ riskReport.reserveProjection.trendDescription }}
            </div>
          </div>

          <div class="escalation-section" *ngIf="riskReport.escalation">
            <div class="risk-section-title">Auto-Escalation State</div>
            <div class="escalation-grid">
              <div class="escalation-item">
                <span class="escalation-label">Level</span>
                <span class="escalation-badge" [style.background]="riskReport.escalation.escalationLevel === 'critical' ? 'rgba(244,67,54,0.2)' : riskReport.escalation.escalationLevel === 'warning' ? 'rgba(232,185,35,0.2)' : riskReport.escalation.escalationLevel === 'caution' ? 'rgba(255,152,0,0.2)' : 'rgba(0,230,118,0.2)'"
                      [style.color]="riskReport.escalation.escalationLevel === 'critical' ? '#f44336' : riskReport.escalation.escalationLevel === 'warning' ? '#E8B923' : riskReport.escalation.escalationLevel === 'caution' ? '#FF9800' : '#00E676'">
                  {{ riskReport.escalation.escalationLevel }}
                </span>
              </div>
              <div class="escalation-item">
                <span class="escalation-label">Creation Frozen</span>
                <span class="escalation-value" [style.color]="riskReport.escalation.creationFrozen ? '#f44336' : '#00E676'">
                  {{ riskReport.escalation.creationFrozen ? 'YES' : 'No' }}
                </span>
              </div>
              <div class="escalation-item">
                <span class="escalation-label">Pods Suspended</span>
                <span class="escalation-value" [style.color]="riskReport.escalation.podsSuspended > 0 ? '#f44336' : '#00E676'">{{ riskReport.escalation.podsSuspended }}</span>
              </div>
              <div class="escalation-item">
                <span class="escalation-label">Auto-Caps Applied</span>
                <span class="escalation-value">{{ riskReport.escalation.autoCapAppliedCount }}</span>
              </div>
              <div class="escalation-item" *ngIf="riskReport.escalation.frozenAt">
                <span class="escalation-label">Frozen At</span>
                <span class="escalation-value">{{ riskReport.escalation.frozenAt | date:'medium' }}</span>
              </div>
            </div>
          </div>

          <div class="risk-warnings" *ngIf="riskReport.warnings.length">
            <div class="risk-section-title">Warnings</div>
            <div class="risk-warning" *ngFor="let w of riskReport.warnings">
              <mat-icon style="font-size:14px;color:#E8B923">warning_amber</mat-icon>
              <span>{{ w }}</span>
            </div>
          </div>
          <div class="risk-recommendations" *ngIf="riskReport.recommendations.length">
            <div class="risk-section-title">Recommendations</div>
            <div class="risk-rec" *ngFor="let r of riskReport.recommendations">
              <mat-icon style="font-size:14px;color:#CE93D8">auto_awesome</mat-icon>
              <span>{{ r }}</span>
            </div>
          </div>
          <div class="risk-pods" *ngIf="riskReport.podsAtRisk.length">
            <div class="risk-section-title">Pod Risk Breakdown</div>
            <table mat-table [dataSource]="riskReport.podsAtRisk" class="admin-table risk-table">
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Title</th>
                <td mat-cell *matCellDef="let p">
                  {{ p.title }}
                  <span class="suspend-badge" *ngIf="p.riskSuspended" style="background:rgba(244,67,54,0.2);color:#f44336;font-size:10px;font-weight:700;padding:0 6px;border-radius:4px;margin-left:6px;">SUSPENDED</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="exposure">
                <th mat-header-cell *matHeaderCellDef>Exposure</th>
                <td mat-cell *matCellDef="let p">\u20A6{{ p.currentExposure | number }} / \u20A6{{ p.maxTotalExposure | number }}</td>
              </ng-container>
              <ng-container matColumnDef="risk">
                <th mat-header-cell *matHeaderCellDef>Risk</th>
                <td mat-cell *matCellDef="let p">
                  <span class="risk-badge" [style.background]="p.exposurePercent >= 80 ? 'rgba(244,67,54,0.2)' : p.exposurePercent >= 50 ? 'rgba(232,185,35,0.2)' : 'rgba(0,230,118,0.2)'"
                        [style.color]="p.exposurePercent >= 80 ? '#f44336' : p.exposurePercent >= 50 ? '#E8B923' : '#00E676'">
                    {{ p.exposurePercent }}%
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="payout">
                <th mat-header-cell *matHeaderCellDef>Pot. Payout</th>
                <td mat-cell *matCellDef="let p">\u20A6{{ p.potentialPayout | number }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="riskColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: riskColumns;"></tr>
            </table>
            <div class="empty-state" *ngIf="riskReport.podsAtRisk.length === 0">No active pods</div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1400px; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { color: #fff; font-size: 24px; font-weight: 600; margin: 0; }
    .stat-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card {
      background: #0D1A30; border-radius: 12px; padding: 20px; display: flex;
      align-items: center; gap: 16px; border: 1px solid rgba(255,255,255,0.06);
    }
    .stat-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .stat-icon mat-icon { font-size: 24px; color: #fff; }
    .stat-info { min-width: 0; }
    .stat-value { color: #fff; font-size: 24px; font-weight: 700; }
    .stat-label { color: rgba(255,255,255,0.4); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    @media (max-width: 768px) { .charts-row { grid-template-columns: 1fr; } }
    .chart-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); }
    .chart-card mat-card-title { color: #fff !important; font-size: 14px !important; font-weight: 600 !important; }
    .bar-chart { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; height: 180px; padding: 16px 0; }
    .bar-item { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }
    .bar-label { color: rgba(255,255,255,0.4); font-size: 11px; }
    .bar-track { width: 100%; max-width: 40px; height: 120px; background: rgba(255,255,255,0.06); border-radius: 4px; position: relative; }
    .bar-fill { position: absolute; bottom: 0; left: 0; right: 0; background: #00E676; border-radius: 4px; transition: height 0.3s; }
    .bar-value { color: rgba(255,255,255,0.6); font-size: 11px; font-weight: 600; }
    .status-list { display: flex; flex-direction: column; gap: 10px; padding: 8px 0; }
    .status-item { display: flex; align-items: center; gap: 12px; }
    .status-label { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.7); font-size: 13px; width: 100px; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; }
    .status-bar-track { flex: 1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
    .status-bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
    .status-count { color: #fff; font-size: 13px; font-weight: 600; width: 40px; text-align: right; }
    .risk-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); margin-top: 24px; }
    ::ng-deep .risk-card .mat-mdc-card-header-text { flex: 1; }
    ::ng-deep .risk-card .mat-mdc-card-title { color: #fff !important; font-size: 16px !important; font-weight: 600 !important; }
    .risk-header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-refresh-risk { color: #90CAF9 !important; border-color: #90CAF9 !important; font-size: 12px !important; }
    .btn-auto-cap { color: #CE93D8 !important; border-color: #CE93D8 !important; font-size: 12px !important; }
    .btn-restore-caps { color: #E8B923 !important; border-color: #E8B923 !important; font-size: 12px !important; }
    .btn-run-escalation { color: #00E676 !important; border-color: #00E676 !important; font-size: 12px !important; }
    .risk-meter-row { display: flex; gap: 24px; padding: 16px 0; flex-wrap: wrap; }
    .risk-gauge { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 150px; }
    .gauge-value { font-size: 48px; font-weight: 800; line-height: 1; }
    .gauge-label { color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .gauge-bar { width: 100%; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
    .gauge-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
    .gauge-level { font-size: 13px; font-weight: 700; letter-spacing: 2px; }
    .risk-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; flex: 1; min-width: 300px; }
    .metric { display: flex; flex-direction: column; gap: 4px; }
    .metric-label { color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .metric-value { color: #fff; font-size: 16px; font-weight: 600; }
    .reserve-section, .escalation-section { padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.06); }
    .reserve-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-top: 8px; }
    .reserve-item { display: flex; flex-direction: column; gap: 2px; }
    .reserve-label { color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .reserve-value { color: #fff; font-size: 14px; font-weight: 600; }
    .reserve-trend-note { color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 8px; font-style: italic; }
    .escalation-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-top: 8px; }
    .escalation-item { display: flex; flex-direction: column; gap: 2px; }
    .escalation-label { color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .escalation-value { color: #fff; font-size: 14px; font-weight: 600; }
    .escalation-badge { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .risk-section-title { color: rgba(255,255,255,0.3); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin: 12px 0 6px; }
    .risk-warnings, .risk-recommendations { padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.06); }
    .risk-warning, .risk-rec { display: flex; align-items: flex-start; gap: 8px; color: rgba(255,255,255,0.7); font-size: 13px; padding: 4px 0; line-height: 1.5; }
    .risk-pods { padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.06); }
    .risk-table { width: 100%; }
    ::ng-deep .admin-table .mat-mdc-header-cell { color: rgba(255,255,255,0.5) !important; font-size: 11px !important; font-weight: 600 !important; text-transform: uppercase !important; border-bottom-color: rgba(255,255,255,0.08) !important; background: transparent !important; }
    ::ng-deep .admin-table .mat-mdc-cell { color: rgba(255,255,255,0.8) !important; font-size: 13px !important; border-bottom-color: rgba(255,255,255,0.05) !important; background: transparent !important; }
    .risk-badge { padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; }
    .empty-state { padding: 24px; text-align: center; color: rgba(255,255,255,0.3); font-size: 13px; }
    .chip { padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #fff; text-transform: capitalize; }
    .forecast-row { margin-top: 24px; }
    .forecast-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); }
    ::ng-deep .forecast-card .mat-mdc-card-header-text { flex: 1; }
    ::ng-deep .forecast-card .mat-mdc-card-title { color: #fff !important; font-size: 16px !important; font-weight: 600 !important; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
    .forecast-badge { font-size: 11px; padding: 2px 10px; border-radius: 10px; font-weight: 700; letter-spacing: 0.5px; }
    .forecast-summary { color: rgba(255,255,255,0.7); font-size: 13px; line-height: 1.6; padding: 8px 0; font-style: italic; }
    .forecast-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; padding: 12px 0; }
    .forecast-item { display: flex; flex-direction: column; gap: 2px; background: rgba(255,255,255,0.03); border-radius: 8px; padding: 12px; }
    .f-label { color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .f-current { color: #fff; font-size: 16px; font-weight: 700; }
    .f-arrow { font-size: 13px; font-weight: 600; }
    .f-next { color: rgba(255,255,255,0.5); font-size: 12px; }
    .f-confidence { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-top: 4px; }
    .forecast-footer { padding: 8px 0 0; border-top: 1px solid rgba(255,255,255,0.06); }
    .forecast-link { color: #90CAF9; font-size: 12px; text-decoration: none; }
    .forecast-link:hover { text-decoration: underline; }
    .t4-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); margin-top: 24px; }
    ::ng-deep .t4-card .mat-mdc-card-header-text { flex: 1; }
    ::ng-deep .t4-card .mat-mdc-card-title { color: #fff !important; font-size: 16px !important; font-weight: 600 !important; }
    .t4-header-actions { display: flex; gap: 8px; }
    .t4-score-row { display: flex; gap: 24px; padding: 16px 0; flex-wrap: wrap; }
    .t4-gauge { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 180px; }
    .t4-gauge-value { font-size: 48px; font-weight: 800; line-height: 1; }
    .t4-gauge-label { color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .t4-gauge-bar { width: 100%; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
    .t4-gauge-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
    .t4-gauge-level { font-size: 13px; font-weight: 700; letter-spacing: 2px; }
    .t4-change { font-size: 13px; font-weight: 600; }
    .t4-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; flex: 1; min-width: 280px; }
    .t4-metric { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.03); border-radius: 8px; padding: 8px 12px; }
    .t4-metric-label { color: rgba(255,255,255,0.4); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; flex: 1; }
    .t4-metric-value { font-size: 14px; font-weight: 700; }
    .t4-metric-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .t4-warnings, .t4-recommendations { padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.06); }
    .t4-section-title { color: rgba(255,255,255,0.3); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin: 8px 0 6px; }
    .t4-warning, .t4-rec { display: flex; align-items: flex-start; gap: 8px; color: rgba(255,255,255,0.7); font-size: 13px; padding: 4px 0; line-height: 1.5; }
  `]
})
export class DashboardComponent implements OnInit {
  Math = Math;
  private admin = inject(AdminService);
  stats: DashboardStats | null = null;
  dailyVolume: { date: string; volume: number }[] = [];
  recentStakes: any[] = [];
  podStatusBreakdown: { status: string; count: number }[] = [];
  maxVolume = 1;
  riskReport: RiskReport | null = null;
  forecast: BIForecast | null = null;
  t4Advisory: T4Advisory | null = null;
  capping = false;
  restoring = false;
  escalating = false;
  t4MetricList: { label: string; value: number; status: string; display: string }[] = [];

  statCards: { icon: string; iconBg: string; label: string; value: number }[] = [];
  stakeColumns = ['user', 'pod', 'amount', 'status'];
  riskColumns = ['title', 'exposure', 'risk', 'payout'];

  ngOnInit() {
    this.admin.getDashboard().subscribe(res => {
      if (res.success) {
        this.stats = res.data;
        this.dailyVolume = res.data.dailyVolume || [];
        this.recentStakes = res.data.recentStakes || [];
        this.podStatusBreakdown = res.data.podStatusBreakdown || [];
        this.maxVolume = Math.max(...this.dailyVolume.map(d => d.volume), 1);
        this.statCards = [
          { icon: 'people', iconBg: 'rgba(0,230,118,0.15)', label: 'Total Users', value: res.data.totalUsers },
          { icon: 'sports_esports', iconBg: 'rgba(232,185,35,0.15)', label: 'Active Pods', value: res.data.activePods },
          { icon: 'casino', iconBg: 'rgba(0,230,118,0.15)', label: 'Total Stakes', value: res.data.totalStakes },
          { icon: 'account_balance', iconBg: 'rgba(232,185,35,0.15)', label: 'Volume (NGN)', value: res.data.totalVolume },
        ];
      }
    });
    this.loadRiskReport();
    this.loadForecast();
    this.loadT4Advisory();
  }

  loadForecast() {
    this.admin.getBIForecast(30).subscribe(res => {
      if (res.success) this.forecast = res.data;
    });
  }

  loadT4Advisory() {
    this.admin.getT4Advisory().subscribe(res => {
      if (res.success) {
        this.t4Advisory = res.data;
        this.t4MetricList = [
          { label: 'Profit Margin', value: res.data.metrics.profitMargin.value, status: res.data.metrics.profitMargin.status, display: res.data.metrics.profitMargin.value + '%' },
          { label: 'User Growth', value: res.data.metrics.userGrowth.value, status: res.data.metrics.userGrowth.status, display: res.data.metrics.userGrowth.value + '%' },
          { label: 'KYC Rate', value: res.data.metrics.kycRate.value, status: res.data.metrics.kycRate.status, display: res.data.metrics.kycRate.value + '%' },
          { label: 'Net Deposits', value: res.data.metrics.netDeposits.value, status: res.data.metrics.netDeposits.status, display: '₦' + Math.abs(res.data.metrics.netDeposits.value).toLocaleString() },
          { label: 'Churn Rate', value: res.data.metrics.churnRate.value, status: res.data.metrics.churnRate.status, display: res.data.metrics.churnRate.value + '%' },
          { label: 'Revenue Trend', value: res.data.metrics.revenueTrend.value, status: res.data.metrics.revenueTrend.status, display: (res.data.metrics.revenueTrend.value >= 0 ? '+' : '') + res.data.metrics.revenueTrend.value + '%' },
        ];
      }
    });
  }

  loadRiskReport() {
    this.admin.getRiskReport().subscribe(res => {
      if (res.success) this.riskReport = res.data;
    });
  }

  applyCaps() {
    this.capping = true;
    this.admin.applyAutoCaps().subscribe(res => {
      this.capping = false;
      if (res.success && res.adjusted > 0) this.loadRiskReport();
    });
  }

  restoreCaps() {
    this.restoring = true;
    this.admin.restoreCaps().subscribe(res => {
      this.restoring = false;
      if (res.success) this.loadRiskReport();
    });
  }

  runEscalation() {
    this.escalating = true;
    this.admin.runRiskEscalation().subscribe(res => {
      this.escalating = false;
      if (res.success) this.loadRiskReport();
    });
  }

  riskColor(level: string): string {
    return level === 'high' ? '#f44336' : level === 'medium' ? '#E8B923' : '#00E676';
  }

  barHeight(vol: number): number {
    return Math.max(4, (vol / this.maxVolume) * 100);
  }

  statusColor(s: string): string {
    const map: Record<string, string> = { draft: '#555', published: '#E8B923', active: '#00E676', settled: '#2196f3', cancelled: '#f44336' };
    return map[s] || '#555';
  }

  statusPercent(count: number): number {
    const total = this.podStatusBreakdown.reduce((a, b) => a + b.count, 0);
    return total ? (count / total) * 100 : 0;
  }

  t4ScoreColor(label: string): string {
    return label === 'critical' ? '#f44336' : label === 'needs_attention' ? '#FF9800' : label === 'fair' ? '#E8B923' : '#00E676';
  }

  stakeStatusColor(s: string): string {
    const map: Record<string, string> = { active: '#E8B923', won: '#00E676', lost: '#f44336', void: '#666', pending: '#E8B923', confirmed: '#00E676', refunded: '#888' };
    return map[s] || '#555';
  }
}
