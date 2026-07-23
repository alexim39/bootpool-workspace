import { Injectable, inject, signal } from '@angular/core';
import { AdminService, CampaignUser, CampaignMessage, CampaignResult } from '../../services';

@Injectable({ providedIn: 'root' })
export class AdminCampaignsStore {
  private admin = inject(AdminService);

  readonly segments = signal<Record<string, CampaignUser[]> | null>(null);
  readonly counts = signal<Record<string, number>>({});
  readonly selectedSegment = signal<string | null>(null);
  readonly generating = signal(false);
  readonly sending = signal(false);
  readonly campaignResult = signal<CampaignResult | null>(null);
  readonly msgSent = signal<boolean[]>([]);
  readonly segmentList = signal<{ key: string; label: string; icon: string; count: number }[]>([]);

  loadSegments() {
    this.admin.getCampaignSegments().subscribe(res => {
      if (res.success) {
        this.segments.set(res.data.segments);
        this.counts.set(res.data.counts);
        const icons: Record<string, string> = { churned: 'person_off', at_risk: 'warning', high_value: 'star', new: 'person_add', active: 'person' };
        const labels: Record<string, string> = { churned: 'Churned', at_risk: 'At Risk', high_value: 'High Value', new: 'New Users', active: 'Active' };
        this.segmentList.set(Object.entries(res.data.counts).map(([key, count]) => ({
          key, label: labels[key] || key, icon: icons[key] || 'people', count,
        })));
      }
    });
  }

  selectSegment(key: string) {
    this.selectedSegment.set(key);
    this.campaignResult.set(null);
    this.msgSent.set([]);
  }

  generate() {
    if (!this.selectedSegment()) return;
    this.generating.set(true);
    this.campaignResult.set(null);
    this.admin.generateCampaign(this.selectedSegment()!, 10).subscribe(res => {
      if (res.success) {
        this.campaignResult.set(res.data);
        this.msgSent.set(res.data.messages.map(() => false));
      }
      this.generating.set(false);
    });
  }

  sendAll() {
    if (!this.campaignResult()?.messages.length) return;
    this.sending.set(true);
    this.admin.sendCampaign(this.campaignResult()!.messages, ['in_app', 'sms']).subscribe(res => {
      if (res.success) {
        this.msgSent.set(this.msgSent().map((_, i) => i < res.sent));
      }
      this.sending.set(false);
    });
  }
}
