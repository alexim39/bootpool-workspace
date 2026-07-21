import { Component, OnInit, inject } from '@angular/core';
import { NgIf, DecimalPipe, SlicePipe } from '@angular/common';
import { AdminService, BIReport } from '../services/admin.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bi-reports',
  standalone: true,
  imports: [NgIf, DecimalPipe, SlicePipe, FormsModule,
    MatCardModule, MatTableModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Ora BI Reports</h1>
        <div class="header-actions">
          <select [(ngModel)]="selectedDays" (change)="loadReport()" class="period-select">
            <option [value]="7">Last 7 days</option>
            <option [value]="30">Last 30 days</option>
            <option [value]="90">Last 90 days</option>
          </select>
          <button mat-stroked-button class="btn-refresh" (click)="loadReport()" [disabled]="loading">
            <mat-icon>refresh</mat-icon> Refresh
          </button>
        </div>
      </div>

      <div class="loading-shim" *ngIf="loading">
        <div class="spinner"></div>
      </div>

      <ng-container *ngIf="report">
        <div class="summary-cards">
          <div class="summary-card profit" *ngIf="report.overview.netProfit >= 0">
            <div class="sc-icon"><mat-icon>trending_up</mat-icon></div>
            <div class="sc-value">\u20A6{{ report.overview.netProfit | number }}</div>
            <div class="sc-label">Net Profit</div>
          </div>
          <div class="summary-card loss" *ngIf="report.overview.netProfit < 0">
            <div class="sc-icon"><mat-icon>trending_down</mat-icon></div>
            <div class="sc-value">-\u20A6{{ Math.abs(report.overview.netProfit) | number }}</div>
            <div class="sc-label">Net Loss</div>
          </div>
          <div class="summary-card">
            <div class="sc-icon"><mat-icon>payments</mat-icon></div>
            <div class="sc-value">\u20A6{{ report.overview.totalRevenue | number }}</div>
            <div class="sc-label">Revenue</div>
          </div>
          <div class="summary-card">
            <div class="sc-icon"><mat-icon>money_off</mat-icon></div>
            <div class="sc-value">\u20A6{{ report.overview.totalPayouts | number }}</div>
            <div class="sc-label">Payouts</div>
          </div>
          <div class="summary-card">
            <div class="sc-icon"><mat-icon>casino</mat-icon></div>
            <div class="sc-value">{{ report.overview.totalStakes | number }}</div>
            <div class="sc-label">Total Stakes</div>
          </div>
          <div class="summary-card">
            <div class="sc-icon"><mat-icon>people</mat-icon></div>
            <div class="sc-value">{{ report.overview.totalUsers | number }}</div>
            <div class="sc-label">Users ({{ report.overview.newUsers }} new)</div>
          </div>
        </div>

        <div class="insight-card" *ngIf="report.aiInsight">
          <div class="insight-header">
            <mat-icon style="color:#CE93D8">auto_awesome</mat-icon>
            <span>Ora's Analysis</span>
          </div>
          <div class="insight-body" [innerHTML]="report.aiInsight | slice:0:2000"></div>
        </div>

        <div class="trend-cards">
          <div class="trend-card">
            <div class="trend-label">Stakes MoM</div>
            <div class="trend-value" [style.color]="report.monthOverMonth.stakesChange >= 0 ? '#00E676' : '#f44336'">
              {{ report.monthOverMonth.stakesChange >= 0 ? '+' : '' }}{{ report.monthOverMonth.stakesChange }}%
            </div>
          </div>
          <div class="trend-card">
            <div class="trend-label">Volume MoM</div>
            <div class="trend-value" [style.color]="report.monthOverMonth.volumeChange >= 0 ? '#00E676' : '#f44336'">
              {{ report.monthOverMonth.volumeChange >= 0 ? '+' : '' }}{{ report.monthOverMonth.volumeChange }}%
            </div>
          </div>
          <div class="trend-card">
            <div class="trend-label">Revenue MoM</div>
            <div class="trend-value" [style.color]="report.monthOverMonth.revenueChange >= 0 ? '#00E676' : '#f44336'">
              {{ report.monthOverMonth.revenueChange >= 0 ? '+' : '' }}{{ report.monthOverMonth.revenueChange }}%
            </div>
          </div>
          <div class="trend-card">
            <div class="trend-label">Users MoM</div>
            <div class="trend-value" [style.color]="report.monthOverMonth.usersChange >= 0 ? '#00E676' : '#f44336'">
              {{ report.monthOverMonth.usersChange >= 0 ? '+' : '' }}{{ report.monthOverMonth.usersChange }}%
            </div>
          </div>
        </div>

        <div class="charts-row">
          <mat-card class="chart-card">
            <mat-card-header><mat-card-title>Profit by Sport</mat-card-title></mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="report.bySport" class="admin-table">
                <ng-container matColumnDef="sport">
                  <th mat-header-cell *matHeaderCellDef>Sport</th>
                  <td mat-cell *matCellDef="let s">{{ s.sport }}</td>
                </ng-container>
                <ng-container matColumnDef="stakes">
                  <th mat-header-cell *matHeaderCellDef>Stakes</th>
                  <td mat-cell *matCellDef="let s">{{ s.stakes }}</td>
                </ng-container>
                <ng-container matColumnDef="revenue">
                  <th mat-header-cell *matHeaderCellDef>Revenue</th>
                  <td mat-cell *matCellDef="let s">\u20A6{{ s.revenue | number }}</td>
                </ng-container>
                <ng-container matColumnDef="payouts">
                  <th mat-header-cell *matHeaderCellDef>Payouts</th>
                  <td mat-cell *matCellDef="let s">\u20A6{{ s.payouts | number }}</td>
                </ng-container>
                <ng-container matColumnDef="profit">
                  <th mat-header-cell *matHeaderCellDef>Profit</th>
                  <td mat-cell *matCellDef="let s">
                    <span [style.color]="s.profit >= 0 ? '#00E676' : '#f44336'">\u20A6{{ s.profit | number }}</span>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="sportColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: sportColumns;"></tr>
              </table>
              <div class="empty-state" *ngIf="report.bySport.length === 0">No data</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="chart-card">
            <mat-card-header><mat-card-title>Profit by League</mat-card-title></mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="report.byLeague" class="admin-table">
                <ng-container matColumnDef="league">
                  <th mat-header-cell *matHeaderCellDef>League</th>
                  <td mat-cell *matCellDef="let s">{{ s.league }}</td>
                </ng-container>
                <ng-container matColumnDef="stakes">
                  <th mat-header-cell *matHeaderCellDef>Stakes</th>
                  <td mat-cell *matCellDef="let s">{{ s.stakes }}</td>
                </ng-container>
                <ng-container matColumnDef="revenue">
                  <th mat-header-cell *matHeaderCellDef>Revenue</th>
                  <td mat-cell *matCellDef="let s">\u20A6{{ s.revenue | number }}</td>
                </ng-container>
                <ng-container matColumnDef="profit">
                  <th mat-header-cell *matHeaderCellDef>Profit</th>
                  <td mat-cell *matCellDef="let s">
                    <span [style.color]="s.profit >= 0 ? '#00E676' : '#f44336'">\u20A6{{ s.profit | number }}</span>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="leagueColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: leagueColumns;"></tr>
              </table>
              <div class="empty-state" *ngIf="report.byLeague.length === 0">No data</div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="table-cards-row">
          <mat-card class="table-card">
            <mat-card-header><mat-card-title>Top Pods by Profit</mat-card-title></mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="report.topPods" class="admin-table">
                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef>Title</th>
                  <td mat-cell *matCellDef="let p">{{ p.title | slice:0:30 }}...</td>
                </ng-container>
                <ng-container matColumnDef="sport">
                  <th mat-header-cell *matHeaderCellDef>Sport</th>
                  <td mat-cell *matCellDef="let p">{{ p.sport }}</td>
                </ng-container>
                <ng-container matColumnDef="stakes">
                  <th mat-header-cell *matHeaderCellDef>Stakes</th>
                  <td mat-cell *matCellDef="let p">{{ p.stakes }}</td>
                </ng-container>
                <ng-container matColumnDef="volume">
                  <th mat-header-cell *matHeaderCellDef>Volume</th>
                  <td mat-cell *matCellDef="let p">\u20A6{{ p.volume | number }}</td>
                </ng-container>
                <ng-container matColumnDef="profit">
                  <th mat-header-cell *matHeaderCellDef>Profit</th>
                  <td mat-cell *matCellDef="let p">
                    <span [style.color]="p.profit >= 0 ? '#00E676' : '#f44336'">\u20A6{{ p.profit | number }}</span>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="podColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: podColumns;"></tr>
              </table>
              <div class="empty-state" *ngIf="report.topPods.length === 0">No data</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="table-card">
            <mat-card-header><mat-card-title>Top Users by Volume</mat-card-title></mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="report.topUsers" class="admin-table">
                <ng-container matColumnDef="phone">
                  <th mat-header-cell *matHeaderCellDef>User</th>
                  <td mat-cell *matCellDef="let u">{{ u.phone }}</td>
                </ng-container>
                <ng-container matColumnDef="staked">
                  <th mat-header-cell *matHeaderCellDef>Total Staked</th>
                  <td mat-cell *matCellDef="let u">\u20A6{{ u.totalStaked | number }}</td>
                </ng-container>
                <ng-container matColumnDef="won">
                  <th mat-header-cell *matHeaderCellDef>Total Won</th>
                  <td mat-cell *matCellDef="let u">\u20A6{{ u.totalWon | number }}</td>
                </ng-container>
                <ng-container matColumnDef="count">
                  <th mat-header-cell *matHeaderCellDef>Bets</th>
                  <td mat-cell *matCellDef="let u">{{ u.stakeCount }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="userColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: userColumns;"></tr>
              </table>
              <div class="empty-state" *ngIf="report.topUsers.length === 0">No data</div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="metrics-card">
          <mat-card class="chart-card">
            <mat-card-header><mat-card-title>User & Financial Metrics</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="metrics-grid">
                <div class="metric-item">
                  <span class="m-label">Total Users</span>
                  <span class="m-value">{{ report.userMetrics.total | number }}</span>
                </div>
                <div class="metric-item">
                  <span class="m-label">New (period)</span>
                  <span class="m-value">{{ report.userMetrics.newLastPeriod }}</span>
                </div>
                <div class="metric-item">
                  <span class="m-label">KYC Rate</span>
                  <span class="m-value">{{ report.userMetrics.kycRate }}%</span>
                </div>
                <div class="metric-item">
                  <span class="m-label">Total Deposits</span>
                  <span class="m-value">\u20A6{{ report.userMetrics.totalDeposits | number }}</span>
                </div>
                <div class="metric-item">
                  <span class="m-label">Total Withdrawals</span>
                  <span class="m-value">\u20A6{{ report.userMetrics.totalWithdrawals | number }}</span>
                </div>
                <div class="metric-item">
                  <span class="m-label">Net Deposits</span>
                  <span class="m-value" [style.color]="report.userMetrics.netDeposits >= 0 ? '#00E676' : '#f44336'">
                    \u20A6{{ report.userMetrics.netDeposits | number }}
                  </span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { max-width: 1400px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .page-header h1 { color: #fff; font-size: 24px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 8px; }
    .header-actions { display: flex; gap: 8px; align-items: center; }
    .period-select { background: #0D1A30; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; }
    .btn-refresh { color: #90caf9 !important; border-color: #90caf9 !important; }
    .loading-shim { display: flex; align-items: center; justify-content: center; padding: 48px; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(0,230,118,0.2); border-top-color: #00E676; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .summary-card { background: #0D1A30; border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.06); }
    .summary-card .sc-icon { margin-bottom: 8px; }
    .summary-card .sc-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .summary-card.profit .sc-icon mat-icon { color: #00E676; }
    .summary-card.loss .sc-icon mat-icon { color: #f44336; }
    .sc-value { font-size: 22px; font-weight: 700; color: #fff; }
    .sc-label { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; text-transform: uppercase; }
    .insight-card { background: rgba(206,147,216,0.08); border: 1px solid rgba(206,147,216,0.2); border-radius: 12px; margin-bottom: 20px; overflow: hidden; }
    .insight-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #fff; font-size: 14px; font-weight: 500; }
    .insight-body { padding: 16px; color: rgba(255,255,255,0.8); font-size: 13px; line-height: 1.6; white-space: pre-line; }
    .trend-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .trend-card { background: #0D1A30; border-radius: 12px; padding: 14px 16px; border: 1px solid rgba(255,255,255,0.06); text-align: center; }
    .trend-label { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
    .trend-value { font-size: 24px; font-weight: 800; }
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    @media (max-width: 960px) { .charts-row { grid-template-columns: 1fr; } .trend-cards { grid-template-columns: 1fr 1fr; } }
    .chart-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); }
    .chart-card mat-card-title { color: #fff !important; font-size: 15px; }
    .admin-table { width: 100%; }
    ::ng-deep .admin-table .mat-mdc-header-cell { color: rgba(255,255,255,0.5) !important; font-size: 11px !important; font-weight: 600 !important; text-transform: uppercase !important; border-bottom-color: rgba(255,255,255,0.08) !important; }
    ::ng-deep .admin-table .mat-mdc-cell { color: rgba(255,255,255,0.8) !important; font-size: 12px !important; border-bottom-color: rgba(255,255,255,0.05) !important; }
    .empty-state { padding: 24px; text-align: center; color: rgba(255,255,255,0.3); font-size: 13px; }
    .table-cards-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    @media (max-width: 960px) { .table-cards-row { grid-template-columns: 1fr; } }
    .table-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); }
    .table-card mat-card-title { color: #fff !important; font-size: 15px; }
    .metrics-card { margin-bottom: 20px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 8px 0; }
    @media (max-width: 600px) { .metrics-grid { grid-template-columns: 1fr 1fr; } }
    .metric-item { display: flex; flex-direction: column; gap: 2px; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 8px; }
    .m-label { font-size: 10px; color: rgba(255,255,255,0.35); text-transform: uppercase; font-weight: 600; }
    .m-value { font-size: 16px; color: #fff; font-weight: 600; }
  `]
})
export class BIReportsComponent implements OnInit {
  protected Math = Math;
  report: BIReport | null = null;
  loading = false;
  selectedDays = 30;
  sportColumns = ['sport', 'stakes', 'revenue', 'payouts', 'profit'];
  leagueColumns = ['league', 'stakes', 'revenue', 'profit'];
  podColumns = ['title', 'sport', 'stakes', 'volume', 'profit'];
  userColumns = ['phone', 'staked', 'won', 'count'];

  private admin = inject(AdminService);

  ngOnInit() { this.loadReport(); }

  loadReport() {
    this.loading = true;
    this.admin.getBIReport(this.selectedDays).subscribe(res => {
      if (res.success) { this.report = res.data; }
      this.loading = false;
    });
  }
}
