import { Component, input, output, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { lastValueFrom } from 'rxjs';
import { PodService, Pod } from '../../../../core/services/pod.service';

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

@Component({
  selector: 'app-manage-pick-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './manage-pick-dialog.component.html',
  styleUrls: ['./manage-pick-dialog.component.scss']
})
export class ManagePickDialogComponent {
  pod = input<Pod | null>(null);
  close = output<void>();
  updated = output<Pod>();

  private pods = inject(PodService);

  newClosesAt = '';
  cancelArmed = signal(false);
  submitting = signal(false);
  errorMsg = signal('');

  constructor() {
    effect(() => {
      const p = this.pod();
      if (p) {
        this.newClosesAt = toLocalInput(p.stakingClosesAt);
        this.cancelArmed.set(false);
        this.errorMsg.set('');
      }
    });
  }

  canCancel(): boolean {
    const p = this.pod();
    return !!p && (p.currentParticipants || 0) === 0 && p.status === 'active';
  }

  canExtend(): boolean {
    if (this.submitting() || !this.pod()) return false;
    const d = new Date(this.newClosesAt);
    if (isNaN(d.getTime())) return false;
    return d.getTime() > Date.now();
  }

  onClose() {
    if (this.submitting()) return;
    this.close.emit();
  }

  async extend() {
    const p = this.pod();
    if (!p || !this.canExtend()) return;
    const closes = new Date(this.newClosesAt);
    if (closes.getTime() <= new Date(p.stakingClosesAt).getTime()) {
      this.errorMsg.set('New closing time must be later than the current one');
      return;
    }
    this.submitting.set(true);
    this.errorMsg.set('');
    try {
      const res = await lastValueFrom(this.pods.managePick(p.id, 'extend', closes.toISOString()));
      if (res?.success && res.data) {
        this.updated.emit(res.data);
      } else {
        this.errorMsg.set('Could not update your pick — try again');
      }
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message || 'Could not update your pick — try again');
    } finally {
      this.submitting.set(false);
    }
  }

  async cancel() {
    const p = this.pod();
    if (!p || !this.canCancel()) return;
    if (!this.cancelArmed()) {
      this.cancelArmed.set(true);
      return;
    }
    this.submitting.set(true);
    this.errorMsg.set('');
    try {
      const res = await lastValueFrom(this.pods.managePick(p.id, 'cancel'));
      if (res?.success && res.data) {
        this.updated.emit(res.data);
      } else {
        this.errorMsg.set('Could not cancel your pick — try again');
      }
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message || 'Could not cancel your pick — try again');
    } finally {
      this.submitting.set(false);
    }
  }
}