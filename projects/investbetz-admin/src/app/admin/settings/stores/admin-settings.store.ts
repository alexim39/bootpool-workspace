import { Injectable, inject, signal } from '@angular/core';
import { AdminService } from '../../services';

@Injectable({ providedIn: 'root' })
export class AdminSettingsStore {
  private admin = inject(AdminService);

  readonly reserveAmount = signal(1000000);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly saveError = signal(false);
  readonly saveMessage = signal('');

  load() {
    this.admin.getSettings().subscribe(res => {
      if (res.success) this.reserveAmount.set(res.data.reserveAmount);
    });
  }

  save() {
    if (!this.reserveAmount() || this.reserveAmount() < 0) return;
    this.saving.set(true);
    this.saved.set(false);
    this.saveError.set(false);
    this.admin.updateSettings({ reserveAmount: this.reserveAmount() }).subscribe({
      next: res => {
        this.saving.set(false);
        this.saved.set(true);
        this.saveError.set(false);
        this.saveMessage.set(`Reserve updated to ₦${res.data.reserveAmount.toLocaleString()}`);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: () => {
        this.saving.set(false);
        this.saved.set(true);
        this.saveError.set(true);
        this.saveMessage.set('Failed to save settings');
        setTimeout(() => this.saved.set(false), 3000);
      }
    });
  }
}
