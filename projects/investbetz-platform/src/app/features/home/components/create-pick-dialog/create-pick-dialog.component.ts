import { Component, input, output, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { lastValueFrom } from 'rxjs';
import { PodService, Pod, CreatePickPayload } from '../../../../core/services/pod.service';

const SELECTIONS = ['Home Win', 'Draw', 'Away Win'];

function defaultClose(): string {
  const d = new Date(Date.now() + 3 * 3600000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

@Component({
  selector: 'app-create-pick-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './create-pick-dialog.component.html',
  styleUrls: ['./create-pick-dialog.component.scss']
})
export class CreatePickDialogComponent {
  open = input(false);
  close = output<void>();
  published = output<Pod>();

  private pods = inject(PodService);

  readonly options = SELECTIONS;

  sport = '';
  league = '';
  homeTeam = '';
  awayTeam = '';
  selection = SELECTIONS[0];
  gainsMultiplier = 2.0;
  minStake = 100;
  maxStake = 50000;
  maxTotalExposure = 5000000;
  closesAt = defaultClose();

  submitting = signal(false);
  errorMsg = signal('');

  constructor() {
    effect(() => {
      if (this.open()) this.reset();
    });
  }

  private reset() {
    this.sport = '';
    this.league = '';
    this.homeTeam = '';
    this.awayTeam = '';
    this.selection = SELECTIONS[0];
    this.gainsMultiplier = 2.0;
    this.minStake = 100;
    this.maxStake = 50000;
    this.maxTotalExposure = 5000000;
    this.closesAt = defaultClose();
    this.errorMsg.set('');
  }

  onClose() {
    if (this.submitting()) return;
    this.errorMsg.set('');
    this.close.emit();
  }

  canSubmit(): boolean {
    return !this.submitting() &&
      !!this.sport.trim() &&
      !!this.homeTeam.trim() &&
      !!this.awayTeam.trim() &&
      this.gainsMultiplier >= 1.01 &&
      this.minStake >= 10 &&
      this.maxStake >= this.minStake &&
      this.maxTotalExposure >= this.maxStake;
  }

  async submit() {
    if (!this.canSubmit()) return;
    const closes = new Date(this.closesAt);
    if (isNaN(closes.getTime())) {
      this.errorMsg.set('Pick a valid closing time');
      return;
    }
    if (closes.getTime() <= Date.now()) {
      this.errorMsg.set('Closing time must be in the future');
      return;
    }
    const payload: CreatePickPayload = {
      sport: this.sport.trim(),
      league: this.league.trim() || undefined,
      homeTeam: this.homeTeam.trim(),
      awayTeam: this.awayTeam.trim(),
      matchDate: closes.toISOString(),
      selection: this.selection,
      gainsMultiplier: Number(this.gainsMultiplier),
      minStake: Number(this.minStake),
      maxStake: Number(this.maxStake),
      maxTotalExposure: Number(this.maxTotalExposure),
      stakingClosesAt: closes.toISOString()
    };
    this.submitting.set(true);
    this.errorMsg.set('');
    try {
      const res = await lastValueFrom(this.pods.createPick(payload));
      if (res?.success && res.data?.pod) {
        this.published.emit(res.data.pod);
      } else {
        this.errorMsg.set('Could not publish your pick — try again');
      }
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message || 'Could not publish your pick — try again');
    } finally {
      this.submitting.set(false);
    }
  }
}