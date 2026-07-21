import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [NgIf, FormsModule],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <h1>Settings</h1>
      </div>

      <div class="settings-card">
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Reserve Amount</div>
            <div class="setting-desc">
              The platform reserve used to calculate risk consumption on the Pods page.
              This represents the maximum liability the platform can absorb.
            </div>
          </div>
          <div class="setting-input-group">
            <span class="input-currency">₦</span>
            <input
              type="number"
              class="setting-input"
              [(ngModel)]="reserveAmount"
              min="0"
              step="100000"
              placeholder="1,000,000"
            />
          </div>
        </div>

        <div class="setting-actions">
          <button class="btn-save" (click)="save()" [disabled]="saving">
            <span *ngIf="!saving">Save Changes</span>
            <span *ngIf="saving">Saving...</span>
          </button>
          <span class="save-message" *ngIf="saved" [class.error]="saveError">{{ saveMessage }}</span>
        </div>
      </div>

      <div class="settings-card">
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">How Reserve Risk is Calculated</div>
            <div class="setting-desc">
              The bar on the Pods page shows the worst-case scenario as a percentage of the reserve:
              <br/><br/>
              <strong>If all pods lose:</strong> total refunds paid = sum of (exposure &times; refund%)
              <br/>
              <strong>If all pods win:</strong> total payouts = sum of (exposure &times; odds &times; 0.9)
              <br/><br/>
              The bar displays the higher of these two values against the configured reserve.
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page { padding: 20px; max-width: 800px; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { color: #fff; font-size: 22px; font-weight: 600; margin: 0; }
    .settings-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); padding: 20px; margin-bottom: 16px; }
    .setting-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
    .setting-info { flex: 1; }
    .setting-label { color: #fff; font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    .setting-desc { color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.5; }
    .setting-input-group { display: flex; align-items: center; gap: 4px; min-width: 200px; }
    .input-currency { color: rgba(255,255,255,0.4); font-size: 18px; font-weight: 600; }
    .setting-input { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 10px 14px; color: #fff; font-size: 16px; font-weight: 600; width: 100%; outline: none; transition: border-color 0.2s; }
    .setting-input:focus { border-color: #E8B923; }
    .setting-input::placeholder { color: rgba(255,255,255,0.2); }
    .setting-actions { display: flex; align-items: center; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
    .btn-save { background: #E8B923; color: #0A1428; border: none; border-radius: 8px; padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
    .btn-save:hover { opacity: 0.9; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .save-message { font-size: 13px; font-weight: 500; }
    .save-message.error { color: #f44336; }
  `]
})
export class SettingsComponent implements OnInit {
  reserveAmount = 1000000;
  saving = false;
  saved = false;
  saveError = false;
  saveMessage = '';

  constructor(private admin: AdminService) {}

  ngOnInit() {
    this.admin.getSettings().subscribe(res => {
      if (res.success) this.reserveAmount = res.data.reserveAmount;
    });
  }

  save() {
    if (!this.reserveAmount || this.reserveAmount < 0) return;
    this.saving = true;
    this.saved = false;
    this.saveError = false;
    this.admin.updateSettings({ reserveAmount: this.reserveAmount }).subscribe({
      next: res => {
        this.saving = false;
        this.saved = true;
        this.saveError = false;
        this.saveMessage = `Reserve updated to ₦${res.data.reserveAmount.toLocaleString()}`;
        setTimeout(() => this.saved = false, 3000);
      },
      error: () => {
        this.saving = false;
        this.saved = true;
        this.saveError = true;
        this.saveMessage = 'Failed to save settings';
        setTimeout(() => this.saved = false, 3000);
      }
    });
  }
}
