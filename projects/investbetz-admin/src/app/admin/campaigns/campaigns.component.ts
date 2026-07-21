import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { AdminService, CampaignUser, CampaignMessage, CampaignResult } from '../services/admin.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule,
    MatCardModule, MatTableModule, MatIconModule,
    MatButtonModule, MatFormFieldModule, MatSelectModule, MatTooltipModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Ora Campaigns</h1>
        <button mat-stroked-button class="btn-refresh" (click)="loadSegments()"><mat-icon>refresh</mat-icon> Refresh</button>
      </div>

      <div class="segment-cards" *ngIf="segments">
        <div class="segment-card" *ngFor="let s of segmentList" (click)="selectSegment(s.key)" [class.selected]="selectedSegment === s.key">
          <div class="sc-icon"><mat-icon>{{ s.icon }}</mat-icon></div>
          <div class="sc-count">{{ s.count }}</div>
          <div class="sc-label">{{ s.label }}</div>
        </div>
      </div>

      <div class="campaign-panel" *ngIf="selectedSegment">
        <div class="campaign-actions">
          <button mat-raised-button class="btn-generate" (click)="generate()" [disabled]="generating">
            <mat-icon>auto_awesome</mat-icon>
            {{ generating ? 'Generating...' : 'Generate AI Messages' }}
          </button>
        </div>

        <div class="preview-list" *ngIf="campaignResult">
          <div class="preview-header">
            <span>{{ campaignResult.messages.length }} messages generated</span>
            <span class="preview-errors" *ngIf="campaignResult.errors.length">{{ campaignResult.errors.length }} errors</span>
            <button mat-stroked-button class="btn-send" (click)="sendAll()" [disabled]="sending">
              <mat-icon>send</mat-icon>
              {{ sending ? 'Sending...' : 'Send All (In-App + SMS)' }}
            </button>
          </div>

          <div class="preview-card" *ngFor="let msg of campaignResult.messages; let i = index">
            <div class="preview-user">
              <span class="pu-name">{{ msg.fullName || msg.phone }}</span>
              <span class="pu-phone">{{ msg.phone }}</span>
              <span class="pu-badge" *ngIf="msg.email">email</span>
            </div>
            <div class="preview-subject">{{ msg.subject }}</div>
            <div class="preview-body">
              <div class="preview-channel">
                <span class="channel-label">In-App:</span>
                <span>{{ msg.inAppTitle }} — {{ msg.inAppMessage }}</span>
              </div>
              <div class="preview-channel">
                <span class="channel-label">SMS:</span>
                <span>{{ msg.smsText }}</span>
              </div>
            </div>
            <div class="preview-status" [class.pending]="!msgSent[i]" [class.sent]="msgSent[i]">
              {{ msgSent[i] ? 'Sent' : 'Ready' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1400px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-header h1 { color: #fff; font-size: 24px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 8px; }
    .btn-refresh { color: #90caf9 !important; border-color: #90caf9 !important; }
    .segment-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .segment-card { background: #0D1A30; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.15s; }
    .segment-card:hover { border-color: rgba(206,147,216,0.4); }
    .segment-card.selected { border-color: #CE93D8; background: rgba(206,147,216,0.08); }
    .segment-card .sc-icon mat-icon { font-size: 28px; width: 28px; height: 28px; color: #CE93D8; }
    .segment-card .sc-count { font-size: 28px; font-weight: 700; color: #fff; margin: 4px 0; }
    .segment-card .sc-label { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; font-weight: 600; }
    .campaign-panel { margin-bottom: 24px; }
    .campaign-actions { margin-bottom: 16px; }
    .btn-generate { background: #CE93D8 !important; color: #0A1428 !important; font-weight: 600; }
    .btn-send { color: #00E676 !important; border-color: #00E676 !important; }
    .preview-header { display: flex; align-items: center; gap: 12px; padding: 8px 0 12px; color: rgba(255,255,255,0.6); font-size: 14px; }
    .preview-header button { margin-left: auto; }
    .preview-errors { color: #E8B923; font-size: 12px; }
    .preview-card { background: #0D1A30; border-radius: 10px; padding: 16px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; gap: 8px; }
    .preview-user { display: flex; align-items: center; gap: 8px; }
    .pu-name { color: #fff; font-weight: 600; font-size: 14px; }
    .pu-phone { color: rgba(255,255,255,0.4); font-size: 12px; }
    .pu-badge { font-size: 10px; background: rgba(33,150,243,0.15); color: #2196f3; padding: 1px 6px; border-radius: 4px; font-weight: 600; }
    .preview-subject { color: #CE93D8; font-size: 14px; font-weight: 500; }
    .preview-body { display: flex; flex-direction: column; gap: 6px; }
    .preview-channel { display: flex; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.6); }
    .channel-label { color: rgba(255,255,255,0.35); font-weight: 600; min-width: 50px; text-transform: uppercase; font-size: 10px; }
    .preview-status { font-size: 11px; font-weight: 600; text-align: right; }
    .preview-status.pending { color: rgba(255,255,255,0.3); }
    .preview-status.sent { color: #00E676; }
    ::ng-deep .mat-mdc-form-field .mdc-text-field--filled { background: rgba(255,255,255,0.05) !important; }
  `]
})
export class CampaignsComponent implements OnInit {
  private admin = inject(AdminService);
  segments: Record<string, CampaignUser[]> | null = null;
  counts: Record<string, number> = {};
  selectedSegment: string | null = null;
  generating = false;
  sending = false;
  campaignResult: CampaignResult | null = null;
  msgSent: boolean[] = [];

  segmentList: { key: string; label: string; icon: string; count: number }[] = [];

  ngOnInit() { this.loadSegments(); }

  loadSegments() {
    this.admin.getCampaignSegments().subscribe(res => {
      if (res.success) {
        this.segments = res.data.segments;
        this.counts = res.data.counts;
        const icons: Record<string, string> = { churned: 'person_off', at_risk: 'warning', high_value: 'star', new: 'person_add', active: 'person' };
        const labels: Record<string, string> = { churned: 'Churned', at_risk: 'At Risk', high_value: 'High Value', new: 'New Users', active: 'Active' };
        this.segmentList = Object.entries(res.data.counts).map(([key, count]) => ({
          key, label: labels[key] || key, icon: icons[key] || 'people', count,
        }));
      }
    });
  }

  selectSegment(key: string) {
    this.selectedSegment = key;
    this.campaignResult = null;
    this.msgSent = [];
  }

  generate() {
    if (!this.selectedSegment) return;
    this.generating = true;
    this.campaignResult = null;
    this.admin.generateCampaign(this.selectedSegment, 10).subscribe(res => {
      if (res.success) {
        this.campaignResult = res.data;
        this.msgSent = res.data.messages.map(() => false);
      }
      this.generating = false;
    });
  }

  sendAll() {
    if (!this.campaignResult?.messages.length) return;
    this.sending = true;
    this.admin.sendCampaign(this.campaignResult.messages, ['in_app', 'sms']).subscribe(res => {
      if (res.success) {
        this.msgSent = this.msgSent.map((_, i) => i < res.sent);
      }
      this.sending = false;
    });
  }
}
