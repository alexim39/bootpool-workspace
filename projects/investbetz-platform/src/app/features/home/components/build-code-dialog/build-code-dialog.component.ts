import { Component, inject, input, output, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HomeStore } from '../../stores/home.store';
import { Pod } from '../../../../core/services';

@Component({
  selector: 'app-build-code-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './build-code-dialog.component.html',
  styleUrls: ['./build-code-dialog.component.scss']
})
export class BuildCodeDialogComponent {
  open = input(false);
  close = output<void>();
  shared = output<void>();

  readonly store = inject(HomeStore);

  search = '';
  submitting = signal(false);
  copied = signal(false);

  constructor() {
    effect(() => {
      if (this.open()) this.reset();
    });
    effect(() => {
      if (this.open() && this.store.bookingCode() && this.submitting()) {
        this.submitting.set(false);
        this.copied.set(false);
      }
    });
  }

  private reset() {
    this.search = '';
    this.copied.set(false);
    this.store.clearBookingCode();
  }

  availablePods = computed(() => {
    const q = this.search.trim().toLowerCase();
    return this.store.displayedPods().filter(p => {
      if (!this.store.isStakable(p)) return false;
      if (!q) return true;
      return `${p.homeTeam} ${p.awayTeam} ${p.league} ${p.title || ''}`.toLowerCase().includes(q);
    });
  });

  selectedCount = computed(() => this.store.betSlipSelections().length);

  combinedMultiplier = computed(() => {
    return this.store.betSlipSelections().reduce((acc, p) => acc * p.gainsMultiplier, 1);
  });

  canCreate = computed(() => {
    return !this.submitting() &&
      this.selectedCount() >= 2 &&
      this.selectedCount() <= this.store.maxBookingCodeLegs;
  });

  toggle(pod: Pod) {
    this.store.toggleSelection(pod);
  }

  isSelected(pod: Pod): boolean {
    return this.store.isSelected(pod.id);
  }

  isFull(): boolean {
    return this.selectedCount() >= this.store.maxBookingCodeLegs;
  }

  onClose() {
    if (this.submitting()) return;
    this.store.closeBuildCode();
  }

  create() {
    if (!this.canCreate()) return;
    this.submitting.set(true);
    const ids = this.store.betSlipSelections().map(s => s.id);
    this.store.createBookingCode(ids);
  }

  async copyCode() {
    const code = this.store.bookingCode();
    if (!code) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }

  shareLink(): string {
    const code = this.store.bookingCode();
    return code ? `${window.location.origin}/home?code=${code}` : '';
  }

  formatExpiry(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  onShared() {
    this.shared.emit();
  }
}
