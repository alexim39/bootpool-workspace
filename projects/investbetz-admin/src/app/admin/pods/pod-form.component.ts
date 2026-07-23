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
import { AdminPod, AdminService } from '../services';

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
  templateUrl: './pod-form.component.html',
  styleUrls: ['./pod-form.component.scss']
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
