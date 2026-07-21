import { Component, OnInit, inject, signal } from '@angular/core';
import { NgIf, NgFor, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminMatchPoolService, AdminMatchPool, AdminPoolDetail, PoolReport, PoolReportsAgg } from '../services/admin-match-pool.service';

type ViewMode = 'list' | 'create' | 'detail' | 'reports';

@Component({
  selector: 'app-admin-match-pools',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <div class="mp-page">
      <div class="page-header">
        <h1>Match Pools</h1>
        <div class="header-actions">
          <button mat-stroked-button (click)="switchView('reports')">Reports</button>
          <button mat-raised-button class="btn-primary" (click)="switchView('create')">Create Pool</button>
        </div>
      </div>

      <!-- List view -->
      @if (view() === 'list') {
        <mat-card class="table-card">
          <div class="filters">
            <mat-form-field appearance="fill" class="filter-field">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="statusFilter" (selectionChange)="loadList()">
                <mat-option value="">All</mat-option>
                <mat-option value="open">Open</mat-option>
                <mat-option value="staking_closed">Staking Closed</mat-option>
                <mat-option value="settled">Settled</mat-option>
                <mat-option value="cancelled">Cancelled</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          @if (loading()) {
            <div class="loading-center"><mat-spinner diameter="32" /></div>
          } @else {
          <table mat-table [dataSource]="pools" class="admin-table">
            <ng-container matColumnDef="eventTitle">
              <th mat-header-cell *matHeaderCellDef>Event</th>
              <td mat-cell *matCellDef="let p" class="clickable" (click)="openDetail(p._id)">{{ p.eventTitle }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let p"><span class="chip" [style.background]="statusColor(p.status)">{{ p.status }}</span></td>
            </ng-container>
            <ng-container matColumnDef="stakingClosesAt">
              <th mat-header-cell *matHeaderCellDef>Staking Closes</th>
              <td mat-cell *matCellDef="let p">{{ p.stakingClosesAt | date:'short' }}</td>
            </ng-container>
            <ng-container matColumnDef="totalPool">
              <th mat-header-cell *matHeaderCellDef>Pool</th>
              <td mat-cell *matCellDef="let p">\u20A6{{ p.totalPool | number }}</td>
            </ng-container>
            <ng-container matColumnDef="markets">
              <th mat-header-cell *matHeaderCellDef>Markets</th>
              <td mat-cell *matCellDef="let p">{{ p.markets.length }}</td>
            </ng-container>
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Created</th>
              <td mat-cell *matCellDef="let p">{{ p.createdAt | date:'short' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p">
                <button mat-icon-button (click)="openDetail(p._id)" matTooltip="View"><mat-icon>visibility</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['eventTitle','status','stakingClosesAt','totalPool','markets','createdAt','actions']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['eventTitle','status','stakingClosesAt','totalPool','markets','createdAt','actions'];"></tr>
          </table>
          }
        </mat-card>
      }

      <!-- Create view -->
      @if (view() === 'create') {
        <mat-card class="form-card">
          <div class="form-header">
            <h2>Create Match Pool</h2>
            <button mat-icon-button (click)="switchView('list')"><mat-icon>close</mat-icon></button>
          </div>
          <div class="form-body">
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Event Title</mat-label>
              <input matInput [(ngModel)]="formTitle" placeholder="World Cup Final: Argentina vs France">
            </mat-form-field>
            <div class="form-row">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Staking Closes At</mat-label>
                <input matInput type="datetime-local" [(ngModel)]="formStakingCloses">
              </mat-form-field>
            </div>
            <div class="form-row">
              <mat-form-field appearance="fill" class="half-width">
                <mat-label>Min Stake</mat-label>
                <input matInput type="number" [(ngModel)]="formMinStake">
              </mat-form-field>
              <mat-form-field appearance="fill" class="half-width">
                <mat-label>Max Stake</mat-label>
                <input matInput type="number" [(ngModel)]="formMaxStake">
              </mat-form-field>
            </div>
            <div class="section-label">Markets (at least 2)</div>
            @for (m of formMarkets; track i; let i = $index) {
              <div class="market-row">
                <mat-form-field appearance="fill" class="flex-field">
                  <mat-label>Market {{ i + 1 }}</mat-label>
                  <input matInput [(ngModel)]="formMarkets[i].label" placeholder="e.g. Argentina to Win">
                </mat-form-field>
                <button mat-icon-button class="remove-btn" (click)="removeMarket(i)" [disabled]="formMarkets.length <= 2"><mat-icon>remove_circle</mat-icon></button>
              </div>
            }
            <button mat-stroked-button (click)="addMarket()" class="add-market-btn">+ Add Market</button>
            <div class="form-actions">
              <button mat-button (click)="switchView('list')">Cancel</button>
              <button mat-raised-button class="btn-primary" (click)="createPool()" [disabled]="saving()">{{ saving() ? 'Creating...' : 'Create Pool' }}</button>
            </div>
            <div class="error-msg" *ngIf="error()">{{ error() }}</div>
          </div>
        </mat-card>
      }

      <!-- Detail view -->
      @if (view() === 'detail' && loading()) {
        <div class="loading-center"><mat-spinner diameter="32" /></div>
      }
      @if (view() === 'detail' && !loading() && detail(); as d) {
        <div class="detail-page">
          <div class="detail-header">
            <button mat-icon-button (click)="switchView('list')"><mat-icon>arrow_back</mat-icon></button>
            <h2>{{ d.pool.eventTitle }}</h2>
            <span class="chip" [style.background]="statusColor(d.pool.status)">{{ d.pool.status }}</span>
          </div>

          <mat-card class="info-card">
            <div class="info-grid">
              <div><span class="label">Staking Closes</span><span class="value">{{ d.pool.stakingClosesAt | date:'medium' }}</span></div>
              <div><span class="label">Total Pool</span><span class="value">\u20A6{{ d.pool.totalPool | number }}</span></div>
              <div><span class="label">Platform Fee (15%)</span><span class="value">\u20A6{{ d.pool.platformFeeAmount | number }}</span></div>
              <div><span class="label">Distributable</span><span class="value">\u20A6{{ d.pool.distributableAmount | number }}</span></div>
              <div><span class="label">Min / Max Stake</span><span class="value">\u20A6{{ d.pool.minStake | number }} / \u20A6{{ d.pool.maxStake | number }}</span></div>
              <div><span class="label">Total Stakers</span><span class="value">{{ d.totalStakes }}</span></div>
            </div>
            @if (d.pool.status === 'open') {
              <div class="action-bar">
                <button mat-stroked-button class="action-close" (click)="closeStaking(d.pool._id)">Close Staking</button>
                <button mat-stroked-button class="action-cancel" (click)="cancelPool(d.pool._id)">Cancel Pool</button>
              </div>
            }
            @if (d.pool.status === 'open' || d.pool.status === 'staking_closed') {
              <div class="settle-section">
                <div class="section-label">Settle Pool</div>
                <div class="settle-row">
                  <mat-form-field appearance="fill">
                    <mat-label>Winning Market</mat-label>
                    <mat-select [(ngModel)]="selectedMarketId">
                      @for (m of d.pool.markets; track m.marketId) {
                        <mat-option [value]="m.marketId">{{ m.label }} (\u20A6{{ m.totalStaked | number }})</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <button mat-raised-button class="action-win" (click)="settlePool(d.pool._id)" [disabled]="!selectedMarketId || settling()">
                    {{ settling() ? 'Settling...' : 'Settle' }}
                  </button>
                </div>
                @if (settlePreview(); as sp) {
                  <div class="settle-preview">
                    <div class="preview-row"><span>Total Pool:</span><span>\u20A6{{ sp.totalPool | number }}</span></div>
                    <div class="preview-row"><span>Platform Fee (15%):</span><span>\u20A6{{ sp.platformFee | number }}</span></div>
                    <div class="preview-row"><span>Distributable:</span><span>\u20A6{{ sp.distributable | number }}</span></div>
                    <div class="preview-row"><span>Winning Market Total:</span><span>\u20A6{{ sp.winningTotal | number }}</span></div>
                    <div class="preview-row"><span>Winners:</span><span>{{ sp.winnerCount }}</span></div>
                  </div>
                }
              </div>
            }
          </mat-card>

          <!-- Market breakdown -->
          <div class="market-cards">
            @for (m of d.marketBreakdown; track m.marketId) {
              <mat-card class="market-card">
                <div class="market-header">
                  <strong>{{ m.label }}</strong>
                  <span class="chip" [style.background]="m.marketId === d.pool.winningMarketId ? '#00E676' : 'rgba(255,255,255,0.1)'">
                    {{ m.marketId === d.pool.winningMarketId ? 'WINNER' : '' }}
                  </span>
                </div>
                <div class="market-stats">
                  <span>Total: \u20A6{{ m.totalStaked | number }}</span>
                  <span>Stakers: {{ m.stakerCount }}</span>
                </div>
                @if (d.pool.status === 'settled' || d.pool.status === 'cancelled') {
                  <button mat-stroked-button (click)="showReport(d.pool._id)" class="report-btn">View Report</button>
                }
              </mat-card>
            }
          </div>
        </div>
      }

      <!-- Reports view -->
      @if (view() === 'reports' && loading()) {
        <div class="loading-center"><mat-spinner diameter="32" /></div>
      }
      @if (view() === 'reports' && !loading() && reportsData(); as r) {
        <div class="reports-page">
          <div class="reports-header">
            <h2>Match Pool Reports</h2>
            <button mat-button (click)="switchView('list')">Back</button>
          </div>
          <div class="stats-row">
            <mat-card class="stat-card"><span class="stat-value">{{ r.totalSettled }}</span><span class="stat-label">Settled Pools</span></mat-card>
            <mat-card class="stat-card"><span class="stat-value">\u20A6{{ r.totalFeeRevenue | number }}</span><span class="stat-label">Fee Revenue</span></mat-card>
            <mat-card class="stat-card"><span class="stat-value">\u20A6{{ r.avgPoolSize | number }}</span><span class="stat-label">Avg Pool Size</span></mat-card>
            <mat-card class="stat-card"><span class="stat-value">{{ r.uniqueStakers }}</span><span class="stat-label">Unique Stakers</span></mat-card>
          </div>
          <mat-card class="table-card">
            <table mat-table [dataSource]="r.pools" class="admin-table">
              <ng-container matColumnDef="eventTitle">
                <th mat-header-cell *matHeaderCellDef>Event</th>
                <td mat-cell *matCellDef="let p">{{ p.eventTitle }}</td>
              </ng-container>
              <ng-container matColumnDef="totalPool">
                <th mat-header-cell *matHeaderCellDef>Pool</th>
                <td mat-cell *matCellDef="let p">\u20A6{{ p.totalPool | number }}</td>
              </ng-container>
              <ng-container matColumnDef="platformFeeAmount">
                <th mat-header-cell *matHeaderCellDef>Fee</th>
                <td mat-cell *matCellDef="let p">\u20A6{{ p.platformFeeAmount | number }}</td>
              </ng-container>
              <ng-container matColumnDef="settledAt">
                <th mat-header-cell *matHeaderCellDef>Settled</th>
                <td mat-cell *matCellDef="let p">{{ p.settledAt | date:'short' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['eventTitle','totalPool','platformFeeAmount','settledAt']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['eventTitle','totalPool','platformFeeAmount','settledAt'];"></tr>
            </table>
          </mat-card>
        </div>
      }

      <!-- Report modal -->
      @if (reportModal(); as rm) {
        <div class="modal-backdrop" (click)="reportModal.set(null)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ rm.eventTitle }}</h3>
              <button mat-icon-button (click)="reportModal.set(null)"><mat-icon>close</mat-icon></button>
            </div>
            <div class="modal-body">
              <div class="report-grid">
                <div><span class="label">Total Pool</span><span class="value">\u20A6{{ rm.totalPool | number }}</span></div>
                <div><span class="label">Platform Fee (15%)</span><span class="value">\u20A6{{ rm.platformFeeAmount | number }}</span></div>
                <div><span class="label">Distributable</span><span class="value">\u20A6{{ rm.distributableAmount | number }}</span></div>
                <div><span class="label">Total Stakers</span><span class="value">{{ rm.totalStakers }}</span></div>
                <div><span class="label">Winners</span><span class="value">{{ rm.totalWinners }}</span></div>
              </div>
              <div class="section-label">Per-Market Breakdown</div>
              @for (mb of rm.marketBreakdown; track mb.marketId) {
                <div class="market-breakdown-item">
                  <span class="market-name">{{ mb.label }}</span>
                  <span>\u20A6{{ mb.totalStaked | number }} ({{ mb.stakerCount }} stakers, {{ mb.winners }} winners)</span>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .mp-page { max-width: 1400px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .page-header h1 { color: #fff; font-size: 24px; font-weight: 600; margin: 0; }
    .header-actions { display: flex; gap: 8px; }
    .btn-primary { background: #00E676 !important; color: #0A1428 !important; }
    .table-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); padding: 16px; }
    .admin-table { width: 100%; }
    ::ng-deep .admin-table .mat-mdc-header-cell { color: rgba(255,255,255,0.5) !important; font-size: 12px !important; font-weight: 600 !important; text-transform: uppercase; border-bottom-color: rgba(255,255,255,0.08) !important; }
    ::ng-deep .admin-table .mat-mdc-cell { color: rgba(255,255,255,0.8) !important; font-size: 13px !important; border-bottom-color: rgba(255,255,255,0.05) !important; }
    .clickable { cursor: pointer; }
    .clickable:hover { color: #00E676; }
    .chip { padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #fff; text-transform: capitalize; }
    .form-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); max-width: 600px; }
    .form-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .form-header h2 { color: #fff; font-size: 16px; font-weight: 600; margin: 0; }
    .form-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
    .full-width { width: 100%; }
    .half-width { width: 100%; }
    .form-row { display: flex; gap: 12px; }
    .section-label { font-size: 12px; color: rgba(255,255,255,0.4); text-transform: uppercase; font-weight: 600; margin-top: 4px; }
    .market-row { display: flex; align-items: center; gap: 8px; }
    .flex-field { flex: 1; }
    .remove-btn { color: #f44336; }
    .add-market-btn { align-self: flex-start; }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
    .error-msg { color: #f44336; font-size: 13px; padding: 8px; background: rgba(244,67,54,0.1); border-radius: 8px; }
    .filters { margin-bottom: 12px; }
    .filter-field { width: 200px; }
    .loading-center { display: flex; justify-content: center; padding: 40px; }
    .detail-page { display: flex; flex-direction: column; gap: 16px; }
    .detail-header { display: flex; align-items: center; gap: 12px; }
    .detail-header h2 { color: #fff; font-size: 20px; font-weight: 600; margin: 0; flex: 1; }
    .info-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); padding: 20px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .info-grid .label { display: block; font-size: 10px; color: rgba(255,255,255,0.35); text-transform: uppercase; font-weight: 600; }
    .info-grid .value { font-size: 14px; color: #fff; font-weight: 500; }
    .action-bar { display: flex; gap: 8px; margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
    .action-close { color: #E8B923 !important; border-color: #E8B923 !important; }
    .action-cancel { color: #f44336 !important; border-color: #f44336 !important; }
    .action-win { background: #00E676 !important; color: #0A1428 !important; }
    .settle-section { margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
    .settle-row { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
    .settle-preview { background: rgba(0,230,118,0.04); border-radius: 8px; padding: 12px; margin-top: 8px; border: 1px solid rgba(0,230,118,0.1); }
    .preview-row { display: flex; justify-content: space-between; font-size: 13px; color: rgba(255,255,255,0.7); padding: 2px 0; }
    .market-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
    .market-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); padding: 16px; }
    .market-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .market-header strong { color: #fff; font-size: 14px; }
    .market-stats { display: flex; gap: 16px; font-size: 12px; color: rgba(255,255,255,0.5); }
    .report-btn { margin-top: 8px; font-size: 12px; }
    .reports-page { display: flex; flex-direction: column; gap: 16px; }
    .reports-header { display: flex; align-items: center; justify-content: space-between; }
    .reports-header h2 { color: #fff; font-size: 20px; font-weight: 600; margin: 0; }
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
    .stat-card { background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; text-align: center; }
    .stat-value { display: block; font-size: 22px; font-weight: 700; color: #00E676; }
    .stat-label { display: block; font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 4px; text-transform: uppercase; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: #0F1B30; border-radius: 14px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.08); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .modal-header h3 { color: #fff; font-size: 16px; font-weight: 600; margin: 0; }
    .modal-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
    .report-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .report-grid .label { display: block; font-size: 10px; color: rgba(255,255,255,0.35); text-transform: uppercase; font-weight: 600; }
    .report-grid .value { font-size: 14px; color: #fff; font-weight: 500; }
    .market-breakdown-item { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .market-name { color: #fff; font-weight: 500; }
  `]
})
export class AdminMatchPoolsComponent implements OnInit {
  private service = inject(AdminMatchPoolService);

  view = signal<ViewMode>('list');
  loading = signal(false);
  pools: AdminMatchPool[] = [];
  statusFilter = '';
  saving = signal(false);
  settling = signal(false);
  error = signal('');

  // Create form
  formTitle = '';
  formStakingCloses = '';
  formMinStake = 100;
  formMaxStake = 100000;
  formMarkets: { label: string }[] = [{ label: '' }, { label: '' }, { label: '' }];

  // Detail
  detail = signal<AdminPoolDetail | null>(null);
  selectedMarketId = '';
  settlePreview = signal<{ totalPool: number; platformFee: number; distributable: number; winningTotal: number; winnerCount: number } | null>(null);

  // Reports
  reportsData = signal<PoolReportsAgg | null>(null);

  // Report modal
  reportModal = signal<PoolReport | null>(null);

  ngOnInit() {
    this.loadList();
  }

  loadList() {
    this.loading.set(true);
    this.service.list({ status: this.statusFilter || undefined }).subscribe({
      next: (res) => { if (res.success) this.pools = res.data.items; this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  switchView(v: ViewMode) {
    this.view.set(v);
    if (v === 'list') this.loadList();
    if (v === 'reports') this.loadReports();
  }

  addMarket() { this.formMarkets.push({ label: '' }); }

  removeMarket(i: number) { if (this.formMarkets.length > 2) this.formMarkets.splice(i, 1); }

  createPool() {
    if (!this.formTitle || !this.formStakingCloses) {
      this.error.set('Event title and staking close time required');
      return;
    }
    const markets = this.formMarkets.filter(m => m.label.trim()).map((m, i) => ({
      marketId: m.label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      label: m.label.trim()
    }));
    if (markets.length < 2) { this.error.set('At least 2 markets required'); return; }

    this.saving.set(true);
    this.error.set('');
    this.service.create({
      eventTitle: this.formTitle,
      markets,
      stakingClosesAt: new Date(this.formStakingCloses).toISOString(),
      minStake: this.formMinStake,
      maxStake: this.formMaxStake
    }).subscribe({
      next: () => { this.saving.set(false); this.switchView('list'); },
      error: (err) => { this.saving.set(false); this.error.set(err.error?.message || 'Failed to create'); }
    });
  }

  openDetail(id: string) {
    this.loading.set(true);
    this.view.set('detail');
    this.service.getDetail(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.detail.set(res.data);
          this.selectedMarketId = '';
          this.settlePreview.set(null);
        }
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.view.set('list'); }
    });
  }

  closeStaking(id: string) {
    if (!confirm('Close staking early? Users will no longer be able to stake.')) return;
    this.service.closeStaking(id).subscribe({
      next: () => this.openDetail(id),
      error: (err) => alert(err.error?.message || 'Failed')
    });
  }

  settlePool(id: string) {
    if (!this.selectedMarketId) return;
    const d = this.detail();
    if (!d) return;
    const market = d.pool.markets.find(m => m.marketId === this.selectedMarketId);
    if (!market) return;

    const totalPool = d.pool.totalPool || d.marketBreakdown.reduce((s, mb) => s + mb.totalStaked, 0);
    const platformFee = Math.floor(totalPool * 0.15);
    const distributable = totalPool - platformFee;
    const winningStakes = d.marketBreakdown.find(mb => mb.marketId === this.selectedMarketId);
    const winningTotal = winningStakes?.totalStaked || 0;

    this.settlePreview.set({ totalPool, platformFee, distributable, winningTotal, winnerCount: winningStakes?.stakerCount || 0 });

    if (!confirm(`Settle "${d.pool.eventTitle}"?\n\nPool: ₦${totalPool.toLocaleString()}\nFee (15%): ₦${platformFee.toLocaleString()}\nDistributable: ₦${distributable.toLocaleString()}\nWinning Market: ${market.label}\nWinners: ${winningStakes?.stakerCount || 0}\n\nThis is irreversible and moves real money.`)) return;

    this.settling.set(true);
    this.service.settle(id, this.selectedMarketId).subscribe({
      next: () => { this.settling.set(false); this.openDetail(id); },
      error: (err) => { this.settling.set(false); alert(err.error?.message || 'Settlement failed'); }
    });
  }

  cancelPool(id: string) {
    if (!confirm('Cancel this match pool? All stakes will be refunded in full.')) return;
    this.service.cancel(id).subscribe({
      next: () => this.openDetail(id),
      error: (err) => alert(err.error?.message || 'Failed')
    });
  }

  showReport(id: string) {
    this.service.getReport(id).subscribe(res => {
      if (res.success) this.reportModal.set(res.data);
    });
  }

  loadReports() {
    this.loading.set(true);
    this.service.getReports().subscribe({
      next: (res) => { if (res.success) this.reportsData.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  statusColor(s: string): string {
    const map: Record<string, string> = { open: '#00E676', staking_closed: '#E8B923', settled: '#2196f3', cancelled: '#888' };
    return map[s] || '#555';
  }
}
