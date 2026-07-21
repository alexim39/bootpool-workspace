import { Component, input, output, signal, effect, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AdminPod, AdminService } from '../services/admin.service';

const MARKET_TYPES = [
  { value: '1X2', label: 'Match Result (1X2)' },
  { value: 'double_chance', label: 'Double Chance' },
  { value: 'over_under', label: 'Over/Under' },
  { value: 'btts', label: 'Both Teams to Score (BTTS)' },
  { value: 'asian_handicap', label: 'Asian Handicap' },
  { value: 'moneyline', label: 'Moneyline' },
  { value: 'draw_no_bet', label: 'Draw No Bet' },
  { value: 'win_to_nil', label: 'Win to Nil' },
];

const SELECTIONS: Record<string, string[]> = {
  '1X2': ['Home', 'Draw', 'Away'],
  double_chance: ['1X', '12', '2X'],
  over_under: ['Over 0.5', 'Under 0.5', 'Over 1.5', 'Under 1.5', 'Over 2.5', 'Under 2.5', 'Over 3.5', 'Under 3.5', 'Over 4.5', 'Under 4.5'],
  btts: ['Yes', 'No'],
  asian_handicap: ['Home -0.5', 'Away +0.5', 'Home -1.0', 'Away +1.0', 'Home -1.5', 'Away +1.5'],
  moneyline: ['Home', 'Away'],
  draw_no_bet: ['Home', 'Away'],
  win_to_nil: ['Home Yes', 'Away Yes'],
};

@Component({
  selector: 'app-pod-form',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatDatepickerModule, MatNativeDateModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ isEdit() ? 'Edit Pod' : 'Create Pod' }}</h2>
          <button mat-icon-button (click)="close.emit()"><mat-icon>close</mat-icon></button>
        </div>

        <form #podForm="ngForm" class="pod-form" (ngSubmit)="save()">
          <div class="form-row">
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Title</mat-label>
              <input matInput [(ngModel)]="formData.title" name="title" required>
            </mat-form-field>
          </div>

          <div class="form-row cols-2">
            <mat-form-field appearance="fill">
              <mat-label>Sport</mat-label>
              <mat-select [(ngModel)]="formData.sport" name="sport" required>
                <mat-option *ngFor="let s of sportsList" [value]="s">{{ s }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>League</mat-label>
              <input matInput [(ngModel)]="formData.league" name="league">
            </mat-form-field>
          </div>

          <div class="form-row cols-2">
            <mat-form-field appearance="fill">
              <mat-label>Home Team</mat-label>
              <input matInput [(ngModel)]="formData.homeTeam" name="homeTeam" required>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>Away Team</mat-label>
              <input matInput [(ngModel)]="formData.awayTeam" name="awayTeam" required>
            </mat-form-field>
          </div>

          <div class="form-row cols-3">
            <mat-form-field appearance="fill">
              <mat-label>Match Date</mat-label>
              <input matInput [matDatepicker]="matchPicker" [(ngModel)]="formData.matchDateObj" name="matchDateObj" required>
              <mat-datepicker-toggle matSuffix [for]="matchPicker"></mat-datepicker-toggle>
              <mat-datepicker #matchPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>Time</mat-label>
              <input matInput type="time" [(ngModel)]="formData.matchTime" name="matchTime" required>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>Market Type</mat-label>
              <mat-select [(ngModel)]="formData.marketType" name="marketType" required (selectionChange)="onMarketTypeChange()">
                <mat-option *ngFor="let mt of marketTypes" [value]="mt.value">{{ mt.label }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="form-row cols-3">
            <mat-form-field appearance="fill">
              <mat-label>Selection</mat-label>
              <mat-select [(ngModel)]="formData.selection" name="selection" required>
                <mat-option *ngFor="let sel of selectionOptions" [value]="sel">{{ sel }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>Multiplier</mat-label>
              <input matInput type="number" step="0.01" [(ngModel)]="formData.gainsMultiplier" name="gainsMultiplier" required>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>Refund %</mat-label>
              <input matInput type="number" min="0" max="100" [(ngModel)]="formData.refundPercent" name="refundPercent">
              <mat-hint>Auto-calc: {{ getAutoRefundPercent() }}%</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>Min Stake</mat-label>
              <input matInput type="number" [(ngModel)]="formData.minStake" name="minStake" required>
            </mat-form-field>
          </div>

          <div class="form-row cols-3">
            <mat-form-field appearance="fill">
              <mat-label>Max Stake</mat-label>
              <input matInput type="number" [(ngModel)]="formData.maxStake" name="maxStake" required>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>Max Total Exposure</mat-label>
              <input matInput type="number" [(ngModel)]="formData.maxTotalExposure" name="maxTotalExposure" required>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>Staking Closes</mat-label>
              <input matInput [matDatepicker]="closesPicker" [(ngModel)]="formData.stakingClosesDateObj" name="stakingClosesDateObj" required>
              <mat-datepicker-toggle matSuffix [for]="closesPicker"></mat-datepicker-toggle>
              <mat-datepicker #closesPicker></mat-datepicker>
            </mat-form-field>
          </div>

          <div class="form-row cols-3">
            <mat-form-field appearance="fill">
              <mat-label>Close Time</mat-label>
              <input matInput type="time" [(ngModel)]="formData.stakingClosesTime" name="stakingClosesTime" required>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>Settlement Estimate</mat-label>
              <input matInput [(ngModel)]="formData.settlementEstimateLabel" name="settlementEstimateLabel">
            </mat-form-field>
            <mat-slide-toggle [(ngModel)]="formData.isLive" name="isLive" color="primary">Live</mat-slide-toggle>
          </div>

          <div class="legs-section">
            <div class="section-header">
              <h3>Legs</h3>
              <button mat-icon-button type="button" (click)="addLeg()" color="primary"><mat-icon>add</mat-icon></button>
            </div>
            <div class="leg-item" *ngFor="let leg of formData.legs; let i = index">
              <div class="leg-fields">
                <mat-form-field appearance="fill">
                  <mat-label>Home</mat-label>
                  <input matInput [(ngModel)]="leg.homeTeam" [name]="'legHome' + i" required>
                </mat-form-field>
                <mat-form-field appearance="fill">
                  <mat-label>Away</mat-label>
                  <input matInput [(ngModel)]="leg.awayTeam" [name]="'legAway' + i" required>
                </mat-form-field>
                <mat-form-field appearance="fill">
                  <mat-label>Date</mat-label>
                  <input matInput type="date" [(ngModel)]="leg.matchDateObj" [name]="'legDate' + i" required>
                </mat-form-field>
                <mat-form-field appearance="fill">
                  <mat-label>League</mat-label>
                  <input matInput [(ngModel)]="leg.league" [name]="'legLeague' + i">
                </mat-form-field>
              </div>
              <button mat-icon-button type="button" color="warn" (click)="removeLeg(i)"><mat-icon>delete</mat-icon></button>
            </div>
          </div>

          <div class="error-msg" *ngIf="saveError">{{ saveError }}</div>
          <div class="form-actions">
            <button mat-button type="button" (click)="close.emit()" [disabled]="saving()">Cancel</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="podForm.invalid || saving()">
              <span *ngIf="!saving()">{{ isEdit() ? 'Update' : 'Create' }} Pod</span>
              <span *ngIf="saving()"><mat-icon style="font-size: 18px; vertical-align: middle; animation: spin 0.8s linear infinite;">sync</mat-icon> Saving...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000;
      display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; overflow-y: auto;
    }
    .modal-content { background: #0D1A30; border-radius: 12px; width: 100%; max-width: 720px; border: 1px solid rgba(255,255,255,0.08); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .modal-header h2 { color: #fff; font-size: 18px; font-weight: 600; margin: 0; }
    .modal-header button { color: rgba(255,255,255,0.5); }
    .pod-form { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: flex; gap: 16px; }
    .form-row.cols-2 > * { flex: 1; }
    .form-row.cols-3 > * { flex: 1; }
    .full-width { width: 100%; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .section-header h3 { color: #fff; font-size: 15px; font-weight: 600; margin: 0; }
    .legs-section { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }
    .leg-item { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 12px; }
    .leg-fields { display: flex; gap: 8px; flex: 1; flex-wrap: wrap; }
    .leg-fields mat-form-field { flex: 1; min-width: 120px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
    .error-msg { color: #f44336; font-size: 13px; padding: 8px 12px; background: rgba(244,67,54,0.1); border-radius: 8px; }
    ::ng-deep .pod-form .mdc-text-field--filled:not(.mdc-text-field--disabled) { background-color: rgba(255,255,255,0.08); border-radius: 6px 6px 0 0; }
    ::ng-deep .pod-form .mdc-text-field--filled:not(.mdc-text-field--disabled) .mdc-floating-label { color: rgba(255,255,255,0.6); }
    ::ng-deep .pod-form .mdc-text-field--filled:not(.mdc-text-field--disabled) .mdc-floating-label--float-above { color: rgba(255,255,255,0.45); }
    ::ng-deep .pod-form .mdc-text-field__input { color: #fff !important; }
    ::ng-deep .pod-form input.mat-mdc-input-element { color: #fff !important; }
    ::ng-deep .pod-form .mat-mdc-select-value-text { color: #fff; }
    ::ng-deep .pod-form .mat-mdc-select-arrow { color: rgba(255,255,255,0.5); }
    ::ng-deep .pod-form .mat-mdc-slide-toggle .mdc-label { color: rgba(255,255,255,0.8); }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PodFormComponent implements OnInit {
  pod = input<AdminPod | null>(null);
  close = output<void>();
  saved = output<AdminPod>();
  private admin = inject(AdminService);

  isEdit = signal(false);
  saving = signal(false);

  sportsList: string[] = [];
  marketTypes = MARKET_TYPES;
  get selectionOptions(): string[] {
    return SELECTIONS[this.formData.marketType] || [];
  }

  formData: any = {
    title: '', sport: '', league: '', homeTeam: '', awayTeam: '',
    matchDateObj: null, matchTime: '',
    marketType: '1X2', selection: '', gainsMultiplier: 1.0, minStake: 100, maxStake: 100000,
    maxTotalExposure: 1000000, stakingClosesDateObj: null, stakingClosesTime: '',
    settlementEstimateLabel: '', isLive: false, legs: []
  };
  saveError = '';

  ngOnInit() {
    this.admin.getSports().subscribe(res => {
      if (res.success) this.sportsList = res.data;
    });
  }

  onMarketTypeChange() {
    this.formData.selection = '';
  }

  getAutoRefundPercent(): number {
    const mult = this.formData.gainsMultiplier || 1;
    const base = mult >= 1.9 ? 5 : mult >= 1.7 ? 20 : mult >= 1.5 ? 35 : 0;
    const maxSafe = Math.floor((1 - 1 / mult) * 100);
    return Math.min(base, maxSafe);
  }

  constructor() {
    effect(() => {
      const p = this.pod();
      if (p) {
        this.isEdit.set(true);
        const mDate = p.matchDate ? new Date(p.matchDate) : null;
        const sDate = p.stakingClosesAt ? new Date(p.stakingClosesAt) : null;
        this.formData = {
          ...p, legs: [...(p.legs || [])],
          matchDateObj: mDate, matchTime: mDate ? mDate.toTimeString().slice(0, 5) : '',
          stakingClosesDateObj: sDate, stakingClosesTime: sDate ? sDate.toTimeString().slice(0, 5) : ''
        };
      }
    });
  }

  addLeg() {
    this.formData.legs.push({ homeTeam: '', awayTeam: '', matchDateObj: null, league: '' });
  }

  removeLeg(i: number) {
    this.formData.legs.splice(i, 1);
  }

  private combineDate(dateObj: Date | null, time: string): string {
    if (!dateObj) return '';
    if (time) {
      const d = new Date(dateObj);
      const [h, m] = time.split(':');
      d.setHours(+h, +m, 0, 0);
      return d.toISOString();
    }
    return dateObj.toISOString();
  }

  save() {
    const matchDate = this.combineDate(this.formData.matchDateObj, this.formData.matchTime);
    const stakingClosesAt = this.combineDate(this.formData.stakingClosesDateObj, this.formData.stakingClosesTime);
    if (!matchDate || !stakingClosesAt) {
      this.saveError = 'Please fill in all date/time fields';
      return;
    }
    const data = {
      ...this.formData,
      matchDate,
      opensAt: this.formData.isLive ? new Date().toISOString() : matchDate,
      stakingClosesAt,
      status: this.formData.isLive ? 'active' : 'draft',
      legs: this.formData.legs.map((leg: any) => ({
        ...leg,
        matchDate: leg.matchDateObj instanceof Date ? leg.matchDateObj.toISOString() : leg.matchDateObj
      }))
    };
    delete data.matchDateObj; delete data.matchTime;
    delete data.stakingClosesDateObj; delete data.stakingClosesTime;
    this.saveError = '';
    this.saving.set(true);
    const request = this.isEdit()
      ? this.admin.updatePod(this.pod()!.id, data)
      : this.admin.createPod(data);
    request.subscribe({
      next: res => {
        this.saving.set(false);
        if (res.success) { this.saved.emit(res.data); this.close.emit(); }
      },
      error: (err: any) => {
        this.saving.set(false);
        this.saveError = err.error?.message || 'Failed to save pod. Check all required fields.';
      }
    });
  }
}
