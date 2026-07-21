import { Component, OnInit, signal } from '@angular/core';
import { NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="user-detail">
      <div class="page-header">
        <button mat-icon-button routerLink="/admin/users" class="back-btn"><mat-icon>arrow_back</mat-icon></button>
        <h1>User Details</h1>
      </div>

      <div class="detail-grid" *ngIf="userData() as data">
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>Account Info</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-row"><span class="label">Phone</span><span class="value">{{ data.user?.phone }}</span></div>
            <div class="info-row"><span class="label">Name</span><span class="value">{{ data.user?.fullName }}</span></div>
            <div class="info-row"><span class="label">Email</span><span class="value">{{ data.user?.email || '-' }}</span></div>
            <div class="info-row">
              <span class="label">Status</span>
              <span class="chip" [style.background]="data.user?.isSuspended ? '#f44336' : '#00E676'">
                {{ data.user?.isSuspended ? 'Suspended' : 'Active' }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">KYC</span>
              <span class="chip" [style.background]="data.user?.kycVerified ? '#00E676' : '#666'">
                {{ data.user?.kycVerified ? 'Verified' : 'Pending' }}
              </span>
            </div>
            <div class="info-row"><span class="label">Joined</span><span class="value">{{ data.user?.createdAt | date:'mediumDate' }}</span></div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-stroked-button (click)="toggleStatus()" [style.color]="data.user?.isSuspended ? '#00E676' : '#f44336'" [style.border-color]="data.user?.isSuspended ? '#00E676' : '#f44336'">
              <mat-icon>{{ data.user?.isSuspended ? 'check_circle' : 'block' }}</mat-icon>
              {{ data.user?.isSuspended ? 'Activate' : 'Suspend' }}
            </button>
            <button mat-stroked-button style="color:#E8B923;border-color:#E8B923" (click)="verifyKyc()">
              <mat-icon>verified</mat-icon>
              {{ data.user?.kycVerified ? 'Unverify KYC' : 'Verify KYC' }}
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="wallet-card" *ngIf="data.wallet">
          <mat-card-header>
            <mat-card-title>Wallet</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="wallet-balance">₦{{ data.wallet.balance | number }}</div>
            <div class="wallet-details">
              <div class="wallet-item">
                <span class="label">Locked</span>
                <span class="value">₦{{ data.wallet.lockedBalance | number }}</span>
              </div>
              <div class="wallet-item">
                <span class="label">Available</span>
                <span class="value">₦{{ (data.wallet.balance - data.wallet.lockedBalance) | number }}</span>
              </div>
              <div class="wallet-item">
                <span class="label">Total Won</span>
                <span class="value">₦{{ data.wallet.totalWon | number }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stakes-card">
          <mat-card-header>
            <mat-card-title>Recent Stakes ({{ data.stakes?.total || 0 }})</mat-card-title>
          </mat-card-header>
          <mat-card-content class="stakes-content">
            @if (data.stakes?.items?.length) {
              <div class="stakes-table-wrap">
                <div class="sth-row">
                  <span class="sth-cell">Pod</span>
                  <span class="sth-cell">Amount</span>
                  <span class="sth-cell">Status</span>
                  <span class="sth-cell">Date</span>
                </div>
                @for (s of data.stakes.items; track s._id) {
                  <div class="st-row">
                    <span class="st-cell st-pod">{{ s.pod?.title || s.podId }}</span>
                    <span class="st-cell st-amount">₦{{ s.stakeAmount | number }}</span>
                    <span class="st-cell"><span class="chip" [style.background]="statusColor(s.status)">{{ s.status }}</span></span>
                    <span class="st-cell st-date">{{ s.createdAt | date:'shortDate' }}</span>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-state">No stakes yet</div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .user-detail { max-width: 1200px; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .page-header h1 { color: #fff; font-size: 24px; font-weight: 600; margin: 0; }
    .back-btn { color: rgba(255,255,255,0.6); }
    .detail-grid { display: flex; flex-direction: column; gap: 16px; }
    mat-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); }
    mat-card-title { color: #fff !important; font-size: 16px; }
    .info-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); gap: 12px; }
    .info-row .label { color: rgba(255,255,255,0.4); font-size: 12px; font-weight: 600; text-transform: uppercase; width: 100px; flex-shrink: 0; }
    .info-row .value { color: #fff; font-size: 14px; }
    .chip { padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #fff; text-transform: capitalize; }
    mat-card-actions { padding: 8px 16px 16px; display: flex; gap: 8px; }
    .wallet-balance { font-size: 32px; font-weight: 700; color: #00E676; padding: 16px 0; }
    .wallet-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .wallet-item { display: flex; flex-direction: column; gap: 2px; }
    .wallet-item .label { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; }
    .wallet-item .value { font-size: 16px; color: #fff; font-weight: 600; }
    .stakes-content { padding: 0 !important; }
    .stakes-table-wrap { display: flex; flex-direction: column; }
    .sth-row { display: flex; background: #162245; padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .sth-cell { flex: 1; color: rgba(255,255,255,0.6); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .st-row { display: flex; align-items: center; padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s; }
    .st-row:last-child { border-bottom: none; }
    .st-row:hover { background: rgba(255,255,255,0.03); }
    .st-cell { flex: 1; color: #fff; font-size: 13px; font-weight: 500; }
    .st-pod { color: rgba(255,255,255,0.8); }
    .st-amount { color: #00E676; font-weight: 600; }
    .st-date { color: rgba(255,255,255,0.4); font-size: 12px; }
    .empty-state { padding: 32px 16px; text-align: center; color: rgba(255,255,255,0.4); font-size: 13px; }
  `]
})
export class UserDetailComponent implements OnInit {
  userData = signal<any>(null);

  constructor(private route: ActivatedRoute, private admin: AdminService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.admin.getUser(id).subscribe(res => {
        if (res.success) this.userData.set(res.data);
      });
    }
  }

  toggleStatus() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.admin.toggleUserStatus(id).subscribe(() => this.ngOnInit());
  }

  verifyKyc() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.admin.verifyUserKyc(id).subscribe(() => this.ngOnInit());
  }

  statusColor(s: string): string {
    const map: Record<string, string> = { pending: '#E8B923', confirmed: '#00E676', active: '#E8B923', won: '#00E676', lost: '#888', void: '#666', cashed_out: '#2196f3', cancelled: '#f44336', refunded: '#888' };
    return map[s] || '#555';
  }
}
