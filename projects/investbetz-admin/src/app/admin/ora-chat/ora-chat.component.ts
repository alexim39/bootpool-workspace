import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService, ChatSessionSummary, ChatSessionDetail, ChatStats } from '../services/admin.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-ora-chat',
  standalone: true,
  imports: [
    NgFor, NgIf, DatePipe, SlicePipe, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatPaginatorModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-left">
          <h1><mat-icon class="header-icon">smart_toy</mat-icon> ORA Chat History</h1>
          <p class="subtitle">Monitor and manage AI assistant conversations</p>
        </div>
      </div>

      <div class="stats-row" *ngIf="stats">
        <div class="stat-card total" (click)="statusFilter=''; loadSessions()">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-card active" (click)="statusFilter='active'; loadSessions()">
          <div class="stat-value">{{ stats.active }}</div>
          <div class="stat-label">Active</div>
        </div>
        <div class="stat-card escalated" (click)="statusFilter='escalated'; loadSessions()">
          <div class="stat-value">{{ stats.escalated }}</div>
          <div class="stat-label">Escalated</div>
        </div>
        <div class="stat-card resolved" (click)="statusFilter='resolved'; loadSessions()">
          <div class="stat-value">{{ stats.resolved }}</div>
          <div class="stat-label">Resolved</div>
        </div>
      </div>

      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="fill" class="filter-field search-field">
            <mat-icon matPrefix>search</mat-icon>
            <mat-label>Search by name, phone or email</mat-label>
            <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange()" placeholder="Search users...">
            <button matSuffix mat-icon-button *ngIf="searchQuery" (click)="searchQuery=''; loadSessions()">
              <mat-icon>close</mat-icon>
            </button>
          </mat-form-field>
          <mat-form-field appearance="fill" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="loadSessions()">
              <mat-option value="">All</mat-option>
              <mat-option value="active">Active</mat-option>
              <mat-option value="escalated">Escalated</mat-option>
              <mat-option value="resolved">Resolved</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <div class="loading-state" *ngIf="loading">
        <mat-spinner diameter="32"></mat-spinner>
        <span>Loading conversations...</span>
      </div>

      <div class="content-split" *ngIf="!loading">
        <div class="session-list" [class.has-selected]="selectedSession">
          <div class="session-item" *ngFor="let s of sessions"
               [class.selected]="selectedId === s._id"
               (click)="selectSession(s._id)">
            <div class="session-avatar">{{ getInitials(s.user) }}</div>
            <div class="session-info">
              <div class="session-user">{{ s.user.fullName || s.user.phone || 'Unknown' }}</div>
              <div class="session-msg">{{ (s.lastMessage || '') | slice:0:80 }}{{ (s.lastMessage || '').length > 80 ? '...' : '' }}</div>
            </div>
            <div class="session-meta">
              <span class="session-time">{{ s.lastActivity | date:'MMM d, h:mm a' }}</span>
              <span class="chip status-{{ s.status }}">{{ s.status }}</span>
              <span class="msg-count">{{ s.messageCount }} msgs</span>
            </div>
            <div class="session-badge escalated-badge" *ngIf="s.status === 'escalated' && !s.escalatedNotified" matTooltip="Notified about escalation">
              <mat-icon>notifications_active</mat-icon>
            </div>
          </div>

          <div class="empty-state" *ngIf="sessions.length === 0">
            <mat-icon class="empty-icon">chat_bubble_outline</mat-icon>
            <p>No conversations found</p>
          </div>

          <mat-paginator *ngIf="totalPages > 1"
            [length]="totalItems"
            [pageSize]="pageSize"
            [pageIndex]="currentPage - 1"
            (page)="onPageChange($event)"
            [showFirstLastButtons]="true">
          </mat-paginator>
        </div>

        <div class="detail-panel" *ngIf="selectedSession">
          <div class="panel-header">
            <div class="panel-user">
              <div class="panel-avatar">{{ getInitials(selectedSession.user) }}</div>
              <div>
                <div class="panel-name">{{ selectedSession.user.fullName || selectedSession.user.phone || 'Unknown' }}</div>
                <div class="panel-phone">{{ selectedSession.user.phone }}<span *ngIf="selectedSession.user.email"> &middot; {{ selectedSession.user.email }}</span></div>
              </div>
            </div>
            <div class="panel-actions">
              <span class="chip status-{{ selectedSession.status }}" *ngIf="!selectedSession.escalationReason">{{ selectedSession.status }}</span>
              <span class="chip escalation-chip" *ngIf="selectedSession.escalationReason" matTooltip="Keyword: {{ selectedSession.escalationReason }}">
                Escalated: "{{ selectedSession.escalationReason }}"
              </span>
              <button mat-stroked-button class="resolve-btn" *ngIf="selectedSession.status !== 'resolved'" (click)="resolveSession()">
                <mat-icon>check_circle</mat-icon> Mark Resolved
              </button>
              <button mat-icon-button (click)="selectedId = null; selectedSession = null">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>

          <div class="messages-container">
            <div class="message" *ngFor="let msg of selectedSession.messages"
                 [class.user-msg]="msg.role === 'user'"
                 [class.assistant-msg]="msg.role === 'assistant'"
                 [class.system-msg]="msg.role === 'system'">
              <div class="msg-avatar">
                <mat-icon *ngIf="msg.role === 'assistant'">smart_toy</mat-icon>
                <mat-icon *ngIf="msg.role === 'user'">person</mat-icon>
                <mat-icon *ngIf="msg.role === 'system'">settings</mat-icon>
              </div>
              <div class="msg-bubble">
                <div class="msg-role-label">{{ msg.role === 'assistant' ? 'ORA AI' : (msg.role === 'user' ? 'User' : 'System') }}</div>
                <div class="msg-content">{{ msg.content }}</div>
                <div class="msg-time">{{ msg.timestamp | date:'MMM d, y h:mm:ss a' }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-placeholder" *ngIf="!selectedSession && sessions.length > 0">
          <mat-icon>chat</mat-icon>
          <p>Select a conversation to view messages</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1400px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; }
    .header-left { display: flex; flex-direction: column; gap: 4px; }
    .header-left h1 { margin: 0; font-size: 24px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; }
    .header-icon { color: #00E676; font-size: 28px; width: 28px; height: 28px; }
    .subtitle { margin: 0; color: rgba(255,255,255,0.5); font-size: 14px; }
    .stats-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .stat-card { flex: 1; min-width: 120px; padding: 16px 20px; border-radius: 12px; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .stat-card.total { background: linear-gradient(135deg, #1a237e, #283593); }
    .stat-card.active { background: linear-gradient(135deg, #004d40, #00695c); }
    .stat-card.escalated { background: linear-gradient(135deg, #b71c1c, #c62828); }
    .stat-card.resolved { background: linear-gradient(135deg, #1b5e20, #2e7d32); }
    .stat-value { font-size: 32px; font-weight: 800; color: #fff; }
    .stat-label { font-size: 12px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    .filter-card { background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; margin-bottom: 20px; }
    .filters { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .filter-field { margin-bottom: 0; }
    .search-field { flex: 1; min-width: 200px; }
    :host ::ng-deep .filter-card .mat-mdc-form-field-subscript-wrapper { display: none; }
    :host ::ng-deep .filter-card .mat-mdc-text-field-wrapper { background: rgba(255,255,255,0.04); border-radius: 8px; }
    :host ::ng-deep .filter-card .mat-mdc-form-field-flex { height: 44px; }
    .loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px; color: rgba(255,255,255,0.5); }
    .content-split { display: flex; gap: 20px; align-items: flex-start; }
    .session-list { flex: 1; min-width: 0; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; }
    .session-list.has-selected { max-width: 420px; }
    .session-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s; position: relative; }
    .session-item:hover { background: rgba(255,255,255,0.04); }
    .session-item.selected { background: rgba(0,230,118,0.08); border-left: 3px solid #00E676; }
    .session-avatar { width: 40px; height: 40px; border-radius: 50%; background: rgba(0,230,118,0.15); display: flex; align-items: center; justify-content: center; color: #00E676; font-weight: 700; font-size: 14px; flex-shrink: 0; }
    .session-info { flex: 1; min-width: 0; }
    .session-user { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 2px; }
    .session-msg { font-size: 12px; color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .session-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .session-time { font-size: 11px; color: rgba(255,255,255,0.35); white-space: nowrap; }
    .msg-count { font-size: 10px; color: rgba(255,255,255,0.3); }
    .chip { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
    .status-active { background: rgba(0,230,118,0.15); color: #00E676; }
    .status-escalated { background: rgba(244,67,54,0.15); color: #f44336; }
    .status-resolved { background: rgba(76,175,80,0.15); color: #4caf50; }
    .escalation-chip { background: rgba(244,67,54,0.2); color: #f44336; font-size: 11px; padding: 3px 10px; }
    .session-badge { position: absolute; top: 8px; right: 8px; }
    .session-badge mat-icon { font-size: 16px; color: #f44336; width: 16px; height: 16px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; color: rgba(255,255,255,0.3); }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
    .detail-panel { flex: 1; min-width: 0; background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; max-height: 80vh; }
    .detail-placeholder { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; color: rgba(255,255,255,0.2); background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; min-height: 300px; }
    .detail-placeholder mat-icon { font-size: 64px; width: 64px; height: 64px; margin-bottom: 16px; }
    .detail-placeholder p { font-size: 16px; margin: 0; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); gap: 12px; flex-wrap: wrap; }
    .panel-user { display: flex; align-items: center; gap: 12px; }
    .panel-avatar { width: 40px; height: 40px; border-radius: 50%; background: rgba(0,230,118,0.15); display: flex; align-items: center; justify-content: center; color: #00E676; font-weight: 700; font-size: 16px; }
    .panel-name { font-size: 16px; font-weight: 600; color: #fff; }
    .panel-phone { font-size: 12px; color: rgba(255,255,255,0.5); }
    .panel-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .resolve-btn { background: rgba(76,175,80,0.12); color: #4caf50; border-color: rgba(76,175,80,0.3); font-size: 12px; padding: 2px 12px; }
    .messages-container { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .message { display: flex; gap: 10px; max-width: 85%; }
    .message.user-msg { align-self: flex-end; flex-direction: row-reverse; }
    .message.assistant-msg { align-self: flex-start; }
    .message.system-msg { align-self: center; opacity: 0.6; max-width: 70%; }
    .msg-avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .msg-avatar mat-icon { font-size: 18px; width: 18px; height: 18px; color: rgba(255,255,255,0.5); }
    .msg-bubble { padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; position: relative; }
    .user-msg .msg-bubble { background: rgba(0,230,118,0.12); border: 1px solid rgba(0,230,118,0.15); }
    .assistant-msg .msg-bubble { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); }
    .system-msg .msg-bubble { background: rgba(255,255,0,0.06); border: 1px solid rgba(255,255,0,0.1); }
    .msg-role-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .msg-content { color: rgba(255,255,255,0.9); white-space: pre-wrap; word-break: break-word; }
    .msg-time { font-size: 10px; color: rgba(255,255,255,0.25); margin-top: 6px; text-align: right; }
    @media (max-width: 900px) {
      .content-split { flex-direction: column; }
      .session-list.has-selected { max-width: none; }
      .detail-panel { max-height: none; }
    }
  `]
})
export class OraChatComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  sessions: ChatSessionSummary[] = [];
  selectedSession: ChatSessionDetail | null = null;
  selectedId: string | null = null;
  stats: ChatStats | null = null;
  loading = false;

  statusFilter = '';
  searchQuery = '';
  currentPage = 1;
  pageSize = 15;
  totalItems = 0;
  totalPages = 0;

  ngOnInit() {
    this.loadStats();
    this.loadSessions();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadSessions();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStats() {
    this.adminService.getChatStats().pipe(takeUntil(this.destroy$)).subscribe({
      next: res => { if (res.success) this.stats = res.data; }
    });
  }

  loadSessions() {
    this.loading = true;
    this.adminService.getChatSessions({
      page: this.currentPage,
      limit: this.pageSize,
      status: this.statusFilter || undefined,
      search: this.searchQuery || undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        if (res.success) {
          this.sessions = res.data.sessions;
          this.totalItems = res.data.total;
          this.totalPages = res.data.pages;
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  selectSession(id: string) {
    this.selectedId = id;
    this.selectedSession = null;
    this.adminService.getChatSession(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        if (res.success) this.selectedSession = res.data;
      }
    });
  }

  resolveSession() {
    if (!this.selectedId) return;
    this.adminService.resolveChatSession(this.selectedId).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        if (res.success) {
          if (this.selectedSession) this.selectedSession.status = 'resolved';
          this.loadStats();
          this.loadSessions();
          this.snackBar.open('Conversation marked as resolved', 'Close', { duration: 3000, panelClass: ['snackbar', 'success'] });
        }
      }
    });
  }

  onSearchChange() {
    this.searchSubject.next(this.searchQuery);
  }

  onPageChange(e: PageEvent) {
    this.currentPage = e.pageIndex + 1;
    this.pageSize = e.pageSize;
    this.loadSessions();
  }

  getInitials(user: any): string {
    if (user?.fullName) return user.fullName.split(' ').map((s: string) => s[0]).join('').toUpperCase().slice(0, 2);
    if (user?.phone) return user.phone.slice(-4);
    return '?';
  }
}
