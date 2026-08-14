import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Stake, StakeService, AutoCashoutStatus } from '../../../../core/services';

@Component({
  selector: 'app-auto-cashout',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './auto-cashout.component.html',
  styleUrls: ['./auto-cashout.component.scss']
})
export class AutoCashoutComponent implements OnInit {
  @Input({ required: true }) stake!: Stake;
  @Output() changed = new EventEmitter<void>();

  panelOpen = false;
  loading = false;
  saving = false;
  target = 0;
  error: string | null = null;
  status: AutoCashoutStatus | null = null;

  constructor(private stakeService: StakeService) {}

  ngOnInit() {
    if (!this.stake.isSettled) {
      this.loadStatus();
    }
  }

  get quote(): number {
    return this.status?.quote ?? 0;
  }

  get maxTarget(): number {
    return this.status?.maxTarget ?? 0;
  }

  get sliderMin(): number {
    return Math.min(100, this.maxTarget || 100);
  }

  get sliderMax(): number {
    return Math.max(this.sliderMin, this.maxTarget);
  }

  get sliderStep(): number {
    return 100;
  }

  get sliderPct(): number {
    const span = this.sliderMax - this.sliderMin;
    if (span <= 0) return 0;
    return Math.min(100, Math.max(0, ((this.target - this.sliderMin) / span) * 100));
  }

  loadStatus() {
    this.loading = true;
    this.stakeService.getAutoCashout(this.stake.id).subscribe({
      next: (res) => {
        this.status = res.data;
        const quote = res.data.quote;
        this.target = Math.min(Math.max(quote, this.sliderMin), this.sliderMax);
      },
      error: () => {},
      complete: () => { this.loading = false; }
    });
  }

  togglePanel() {
    this.panelOpen = !this.panelOpen;
  }

  onTargetChange(event: Event) {
    this.target = Number((event.target as HTMLInputElement).value);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount || 0);
  }

  arm() {
    this.error = null;
    const target = Math.floor(this.target || 0);
    if (target < 100 || target > this.maxTarget) {
      this.error = `Target must be between ₦100 and ${this.formatCurrency(this.maxTarget)}`;
      return;
    }
    this.saving = true;
    this.stakeService.armAutoCashout(this.stake.id, target).subscribe({
      next: () => {
        this.status = this.status
          ? { ...this.status, enabled: true, targetAmount: target }
          : { enabled: true, targetAmount: target, triggeredAt: null, triggerQuote: null, quote: target, maxTarget: this.maxTarget };
        this.panelOpen = false;
        this.changed.emit();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to arm auto-cashout';
      },
      complete: () => { this.saving = false; }
    });
  }

  cancel() {
    this.error = null;
    this.saving = true;
    this.stakeService.disableAutoCashout(this.stake.id).subscribe({
      next: () => {
        this.status = this.status ? { ...this.status, enabled: false, targetAmount: null } : null;
        this.changed.emit();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to cancel auto-cashout';
      },
      complete: () => { this.saving = false; }
    });
  }
}
