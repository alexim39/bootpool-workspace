import { Component, Inject } from '@angular/core';
import { SlicePipe, DatePipe, DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminStake } from '../services';
import { AdminStakesStore } from './stores/admin-stakes.store';

@Component({
  selector: 'app-stake-detail-dialog',
  standalone: true,
  imports: [SlicePipe, DatePipe, DecimalPipe, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="dialog-overlay">
      <div class="dialog-header">
        <div class="dialog-header-left">
          <h2>Stake Details</h2>
          <span class="id-badge">{{ (_data._id || _data.id) | slice:0:12 }}...</span>
          @if (_data.isParlay) {
            <span class="type-badge parlay">Accumulator</span>
          } @else {
            <span class="type-badge single">Single</span>
          }
        </div>
        <button mat-icon-button (click)="close()" matTooltip="Close"><mat-icon>close</mat-icon></button>
      </div>

      <div class="dialog-scroll">
        <section>
          <div class="section-title">User</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Phone</span>
              <span class="value">{{ _data.user?.phone || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Name</span>
              <span class="value">{{ _data.user?.fullName || _data.user?.name || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Email</span>
              <span class="value">{{ _data.user?.email || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="label">User ID</span>
              <span class="value mono">{{ (_data.userId || '') | slice:0:16 }}...</span>
            </div>
          </div>
        </section>

        <section>
          <div class="section-title">Stake</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Status</span>
              <span class="chip" [style.background]="statusColor(_data.status)">{{ _data.status }}</span>
            </div>
            <div class="info-item">
              <span class="label">Amount</span>
              <span class="value accent">&#x20A6;{{ _data.stakeAmount | number }}</span>
            </div>
            <div class="info-item">
              <span class="label">Potential Payout</span>
              <span class="value accent">&#x20A6;{{ _data.potentialPayout | number }}</span>
            </div>
            @if (_data.netPayout) {
              <div class="info-item">
                <span class="label">Net Payout</span>
                <span class="value accent">&#x20A6;{{ _data.netPayout | number }}</span>
              </div>
            }
            @if (_data.platformFee) {
              <div class="info-item">
                <span class="label">Platform Fee</span>
                <span class="value" style="color:#E8B923">&#x20A6;{{ _data.platformFee | number }}</span>
              </div>
            }
            @if (_data.combinedMultiplier) {
              <div class="info-item">
                <span class="label">Combined Odds</span>
                <span class="value" style="color:#CE93D8">{{ _data.combinedMultiplier!.toFixed(2) }}x</span>
              </div>
            }
            @if (_data.settledAt) {
              <div class="info-item">
                <span class="label">Settled At</span>
                <span class="value">{{ _data.settledAt | date:'medium' }}</span>
              </div>
            }
            <div class="info-item">
              <span class="label">Created</span>
              <span class="value">{{ _data.createdAt | date:'medium' }}</span>
            </div>
            @if (_data.settlementNotes) {
              <div class="info-item full-width">
                <span class="label">Notes</span>
                <span class="value">{{ _data.settlementNotes }}</span>
              </div>
            }
          </div>
        </section>

        <section>
          <div class="section-title">Pod / Market</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Title</span>
              <span class="value">{{ _data.pod?.title || _data.podId }}</span>
            </div>
            @if (_data.pod?.sport) {
              <div class="info-item">
                <span class="label">Sport</span>
                <span class="value">{{ _data.pod!.sport }}</span>
              </div>
            }
            @if (_data.pod?.marketType) {
              <div class="info-item">
                <span class="label">Market</span>
                <span class="value">{{ _data.pod!.marketType }}</span>
              </div>
            }
            @if (_data.pod?.selection) {
              <div class="info-item">
                <span class="label">Selection</span>
                <span class="value" style="color:#00E676">{{ _data.pod!.selection }}</span>
              </div>
            }
          </div>
        </section>

        @if (_data.isParlay && _data.items && _data.items.length > 1) {
          <section>
            <div class="section-title-row">
              <span class="section-title">Legs ({{ _data.items.length }})</span>
              <div class="progress-pill">
                <div class="progress-track">
                  <div class="progress-fill" [style.width.%]="legProgress()"></div>
                </div>
                <span class="progress-count">{{ settledLegCount() }}/{{ _data.items.length }}</span>
              </div>
            </div>
            <div class="legs-list">
              @for (item of _data.items; track item; let i = $index) {
                <div class="leg-row"
                  [class.won]="item.status === 'won'"
                  [class.lost]="item.status === 'lost'"
                  [class.void]="item.status === 'void'">
                  <div class="leg-index">{{ i + 1 }}</div>
                  <div class="leg-body">
                    <span class="leg-teams">{{ item.homeTeam }} vs {{ item.awayTeam }}</span>
                    <span class="leg-detail">{{ item.selection }} &#64; {{ item.gainsMultiplier.toFixed(2) }}x</span>
                  </div>
                  @if (item.status !== 'pending') {
                    <span class="leg-pill"
                      [class.won]="item.status === 'won'"
                      [class.lost]="item.status === 'lost'"
                      [class.void]="item.status === 'void'">
                      {{ item.status }}
                    </span>
                  }
                  @if (canSettle && item.status === 'pending') {
                    <div class="leg-actions">
                      <button class="btn-leg W" (click)="settleLeg(i, 'win')" matTooltip="Win">W</button>
                      <button class="btn-leg L" (click)="settleLeg(i, 'loss')" matTooltip="Loss">L</button>
                      <button class="btn-leg V" (click)="settleLeg(i, 'void')" matTooltip="Void">V</button>
                    </div>
                  }
                </div>
              }
            </div>
          </section>
        }
      </div>

      @if (canSettle) {
        <div class="dialog-footer">
          @if (_data.isParlay) {
            <div class="footer-info">Settle individual legs above</div>
          }
          @if (!_data.isParlay) {
            <div class="footer-actions">
              <button mat-stroked-button class="btn-win" (click)="settleStake('win')">Win</button>
              <button mat-stroked-button class="btn-loss" (click)="settleStake('loss')">Loss</button>
              <button mat-stroked-button class="btn-void" (click)="settleStake('void')">Void</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dialog-overlay { width: 620px; max-width: 92vw; max-height: 90vh; display: flex; flex-direction: column; background: #0A1525; border-radius: 16px; overflow: hidden; }
    .dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
    .dialog-header-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .dialog-header-left h2 { margin: 0; font-size: 17px; font-weight: 600; color: #fff; white-space: nowrap; }
    .id-badge { font-size: 10px; color: rgba(255,255,255,0.3); font-family: monospace; background: rgba(255,255,255,0.04); padding: 2px 8px; border-radius: 6px; }
    .type-badge { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 10px; border-radius: 8px; }
    .type-badge.single { background: rgba(33,150,243,0.15); color: #90CAF9; }
    .type-badge.parlay { background: rgba(206,147,216,0.15); color: #CE93D8; }
    .dialog-scroll { flex: 1; overflow-y: auto; padding: 16px 24px 8px; }
    .dialog-scroll::-webkit-scrollbar { width: 4px; }
    .dialog-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
    section { margin-bottom: 16px; }
    .section-title { font-size: 10px; color: #00E676; text-transform: uppercase; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .section-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .section-title-row .section-title { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
    .progress-pill { display: flex; align-items: center; gap: 8px; }
    .progress-track { width: 80px; height: 5px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #00E676, #CE93D8); border-radius: 3px; transition: width 0.4s ease; }
    .progress-count { font-size: 10px; color: rgba(255,255,255,0.35); font-weight: 500; white-space: nowrap; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item { display: flex; flex-direction: column; gap: 2px; }
    .info-item.full-width { grid-column: 1 / -1; }
    .info-item .label { font-size: 9px; color: rgba(255,255,255,0.3); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
    .info-item .value { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; word-break: break-all; }
    .info-item .value.accent { color: #00E676; font-weight: 600; }
    .info-item .value.mono { font-family: monospace; font-size: 11px; color: rgba(255,255,255,0.4); }
    .chip { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 10px; font-weight: 600; color: #fff; text-transform: capitalize; width: fit-content; }
    .legs-list { display: flex; flex-direction: column; gap: 6px; }
    .leg-row { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); transition: all 0.15s; }
    .leg-row.won { border-color: rgba(0,230,118,0.25); background: rgba(0,230,118,0.04); }
    .leg-row.lost { border-color: rgba(244,67,54,0.25); background: rgba(244,67,54,0.04); }
    .leg-row.void { border-color: rgba(232,185,35,0.2); background: rgba(232,185,35,0.03); }
    .leg-index { width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.4); flex-shrink: 0; }
    .leg-body { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .leg-teams { font-size: 12px; color: #fff; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .leg-detail { font-size: 10px; color: rgba(255,255,255,0.35); }
    .leg-pill { font-size: 9px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 6px; }
    .leg-pill.won { background: rgba(0,230,118,0.15); color: #00E676; }
    .leg-pill.lost { background: rgba(244,67,54,0.15); color: #f44336; }
    .leg-pill.void { background: rgba(232,185,35,0.15); color: #E8B923; }
    .leg-actions { display: flex; gap: 3px; flex-shrink: 0; }
    .btn-leg { width: 26px; height: 24px; border-radius: 6px; border: 1px solid; font-size: 10px; font-weight: 700; cursor: pointer; background: transparent; transition: all 0.12s; display: flex; align-items: center; justify-content: center; }
    .btn-leg.W { color: #00E676; border-color: rgba(0,230,118,0.3); }
    .btn-leg.W:hover { background: rgba(0,230,118,0.12); }
    .btn-leg.L { color: #f44336; border-color: rgba(244,67,54,0.3); }
    .btn-leg.L:hover { background: rgba(244,67,54,0.12); }
    .btn-leg.V { color: #E8B923; border-color: rgba(232,185,35,0.3); }
    .btn-leg.V:hover { background: rgba(232,185,35,0.12); }
    .dialog-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-top: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.15); flex-shrink: 0; }
    .footer-info { font-size: 11px; color: rgba(255,255,255,0.3); font-style: italic; }
    .footer-actions { display: flex; gap: 8px; }
    .btn-win { color: #00E676 !important; border-color: #00E676 !important; }
    .btn-loss { color: #f44336 !important; border-color: #f44336 !important; }
    .btn-void { color: #888 !important; border-color: #888 !important; }
  `]
})
export class StakeDetailDialogComponent {
  protected canSettle: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) protected _data: AdminStake,
    private dialogRef: MatDialogRef<StakeDetailDialogComponent>,
    private store: AdminStakesStore
  ) {
    this.canSettle = ['pending', 'confirmed', 'active'].includes(_data.status);
  }

  close() { this.dialogRef.close(); }

  statusColor(s: string): string {
    const map: Record<string, string> = { pending: '#E8B923', confirmed: '#00E676', active: '#E8B923', won: '#00E676', lost: '#888', void: '#666', cashed_out: '#2196f3', cancelled: '#f44336', refunded: '#888' };
    return map[s] || '#555';
  }

  legProgress(): number {
    if (!this._data.items || this._data.items.length === 0) return 0;
    const settled = this._data.items.filter(i => i.status !== 'pending').length;
    return Math.round((settled / this._data.items.length) * 100);
  }

  settledLegCount(): number {
    if (!this._data.items) return 0;
    return this._data.items.filter(i => i.status !== 'pending').length;
  }

  settleStake(result: string) {
    const id = this._data._id || this._data.id;
    this.store.settleStake(id, result);
    this.dialogRef.close();
  }

  settleLeg(legIndex: number, result: string) {
    const id = this._data._id || this._data.id;
    this.store.settleLeg(id, legIndex, result);
    this.dialogRef.close();
  }
}
