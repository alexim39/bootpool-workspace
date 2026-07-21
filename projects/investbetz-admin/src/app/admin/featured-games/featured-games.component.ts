import { Component, OnInit, signal, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, FeaturedBanner } from '../services/admin.service';

@Component({
  selector: 'app-featured-games',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  template: `
    <div class="featured-page">
      <div class="page-header">
        <h1>Featured Games</h1>
        <button class="btn-add" (click)="startCreate()">+ New Banner</button>
      </div>

      <div class="form-card" *ngIf="showForm()">
        <div class="form-title">{{ editingId() ? 'Edit Banner' : 'Create Banner' }}</div>
        <div class="form-grid">
          <div class="form-group">
            <label>Title *</label>
            <input type="text" [(ngModel)]="form.title" placeholder="e.g. World Cup Final" maxlength="100" />
          </div>
          <div class="form-group">
            <label>Subtitle</label>
            <input type="text" [(ngModel)]="form.subtitle" placeholder="e.g. France vs Argentina" maxlength="150" />
          </div>
          <div class="form-group full-width">
            <label>Description</label>
            <div class="input-with-ai">
              <input type="text" [(ngModel)]="form.description" placeholder="e.g. The biggest game of the year is here!" maxlength="300" />
              <button class="btn-ora" (click)="generateDesc()" [disabled]="generating || !form.title.trim()" title="Generate with Ora AI">
                <span class="ora-dot"></span>
                {{ generating ? 'Thinking...' : 'Ora AI' }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>Emoji</label>
            <input type="text" [(ngModel)]="form.emoji" placeholder="🏆" maxlength="10" />
          </div>
          <div class="form-group">
            <label>CTA Label</label>
            <input type="text" [(ngModel)]="form.ctaLabel" placeholder="Bet Now" maxlength="30" />
          </div>
          <div class="form-group">
            <label>CTA Link</label>
            <input type="text" [(ngModel)]="form.ctaLink" placeholder="/home" />
          </div>
          <div class="form-group">
            <label>Gradient Start</label>
            <div class="color-input">
              <input type="color" [(ngModel)]="form.gradientStart" />
              <input type="text" [(ngModel)]="form.gradientStart" placeholder="#E8B923" />
            </div>
          </div>
          <div class="form-group">
            <label>Gradient End</label>
            <div class="color-input">
              <input type="color" [(ngModel)]="form.gradientEnd" />
              <input type="text" [(ngModel)]="form.gradientEnd" placeholder="#FF6B35" />
            </div>
          </div>
          <div class="form-group">
            <label>Display Order</label>
            <input type="number" [(ngModel)]="form.displayOrder" min="0" />
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="form.isActive" />
              Active
            </label>
          </div>
          <div class="form-group">
            <label>Starts At</label>
            <input type="datetime-local" [(ngModel)]="form.startsAt" />
          </div>
          <div class="form-group">
            <label>Expires At</label>
            <input type="datetime-local" [(ngModel)]="form.expiresAt" />
          </div>
        </div>

        <div class="preview-card"
          [style.--grad-start]="form.gradientStart || '#E8B923'"
          [style.--grad-end]="form.gradientEnd || '#FF6B35'">
          <div class="preview-emoji">{{ form.emoji || '🔥' }}</div>
          <div class="preview-text">
            <div class="preview-title">{{ form.title || 'Preview Title' }}</div>
            <div class="preview-subtitle">{{ form.subtitle || 'Preview Subtitle' }}</div>
          </div>
          <div class="preview-cta">{{ form.ctaLabel || 'Bet Now' }}</div>
        </div>

        <div class="form-actions">
          <button class="btn-cancel" (click)="cancelForm()">Cancel</button>
          <button class="btn-save" (click)="save()" [disabled]="saving || !form.title.trim()">
            {{ saving ? 'Saving...' : (editingId() ? 'Update' : 'Create') }}
          </button>
        </div>
      </div>

      <div class="banners-list">
        <div class="banner-item" *ngFor="let b of banners(); trackBy: trackById" [class.inactive]="!b.isActive">
          <div class="banner-preview"
            [style.--grad-start]="b.gradientStart"
            [style.--grad-end]="b.gradientEnd">
            <span class="banner-emoji">{{ b.emoji }}</span>
          </div>
          <div class="banner-info">
            <div class="banner-title">{{ b.title }}</div>
            <div class="banner-subtitle" *ngIf="b.subtitle">{{ b.subtitle }}</div>
            <div class="banner-meta">
              <span class="meta-badge" [class.active-badge]="b.isActive">
                {{ b.isActive ? 'Active' : 'Inactive' }}
              </span>
              <span class="meta-order">Order: {{ b.displayOrder }}</span>
            </div>
          </div>
          <div class="banner-actions">
            <button class="btn-icon" title="Edit" (click)="startEdit(b)">✏️</button>
            <button class="btn-icon btn-danger" title="Delete" (click)="remove(b._id)">🗑️</button>
          </div>
        </div>
        <div class="empty-state" *ngIf="banners().length === 0">
          <p>No featured games yet. Create your first banner above!</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .featured-page { padding: 20px; max-width: 900px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { color: #fff; font-size: 22px; font-weight: 600; margin: 0; }
    .btn-add { background: #E8B923; color: #0A1428; border: none; border-radius: 8px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-add:hover { opacity: 0.9; }
    .form-card { background: #0D1A30; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; margin-bottom: 20px; }
    .form-title { color: #fff; font-size: 16px; font-weight: 600; margin-bottom: 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { display: block; color: rgba(255,255,255,0.6); font-size: 12px; font-weight: 500; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-group input[type="text"],
    .form-group input[type="number"],
    .form-group input[type="datetime-local"] {
      width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px; padding: 8px 12px; color: #fff; font-size: 14px; outline: none; box-sizing: border-box;
    }
    .input-with-ai { display: flex; gap: 8px; }
    .input-with-ai input { flex: 1; }
    .btn-ora {
      display: flex; align-items: center; gap: 6px; flex-shrink: 0; white-space: nowrap;
      background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none;
      border-radius: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-ora:hover { opacity: 0.9; }
    .btn-ora:disabled { opacity: 0.5; cursor: not-allowed; }
    .ora-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #a78bfa;
      animation: ora-pulse 1.5s ease-in-out infinite;
    }
    @keyframes ora-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .form-group input:focus { border-color: #E8B923; }
    .form-group input::placeholder { color: rgba(255,255,255,0.25); }
    .color-input { display: flex; align-items: center; gap: 8px; }
    .color-input input[type="color"] { width: 36px; height: 36px; border: none; border-radius: 6px; padding: 0; cursor: pointer; background: none; }
    .color-input input[type="text"] { flex: 1; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; color: #fff !important; font-size: 14px !important; text-transform: none !important; letter-spacing: 0 !important; cursor: pointer; padding-top: 20px; }
    .checkbox-label input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; }
    .preview-card {
      margin-top: 16px; border-radius: 12px; padding: 16px 20px;
      background: linear-gradient(135deg, var(--grad-start), var(--grad-end));
      display: flex; align-items: center; gap: 16px;
    }
    .preview-emoji { font-size: 32px; }
    .preview-text { flex: 1; }
    .preview-title { color: #fff; font-size: 16px; font-weight: 700; }
    .preview-subtitle { color: rgba(255,255,255,0.8); font-size: 13px; }
    .preview-cta { padding: 6px 16px; border-radius: 6px; background: rgba(0,0,0,0.2); color: #fff; font-size: 13px; font-weight: 600; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.15); }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
    .btn-cancel { background: rgba(255,255,255,0.08); color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 14px; cursor: pointer; }
    .btn-cancel:hover { background: rgba(255,255,255,0.12); }
    .btn-save { background: #E8B923; color: #0A1428; border: none; border-radius: 8px; padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-save:hover { opacity: 0.9; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .banners-list { display: flex; flex-direction: column; gap: 8px; }
    .banner-item {
      display: flex; align-items: center; gap: 14px; padding: 12px 16px;
      background: #0D1A30; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;
      transition: opacity 0.2s;
    }
    .banner-item.inactive { opacity: 0.5; }
    .banner-preview {
      width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--grad-start), var(--grad-end));
      display: flex; align-items: center; justify-content: center;
    }
    .banner-emoji { font-size: 22px; }
    .banner-info { flex: 1; min-width: 0; }
    .banner-title { color: #fff; font-size: 14px; font-weight: 600; }
    .banner-subtitle { color: rgba(255,255,255,0.5); font-size: 12px; }
    .banner-meta { display: flex; gap: 10px; margin-top: 4px; }
    .meta-badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); font-weight: 500; }
    .meta-badge.active-badge { background: rgba(0,230,118,0.15); color: #00E676; }
    .meta-order { font-size: 11px; color: rgba(255,255,255,0.35); }
    .banner-actions { display: flex; gap: 6px; flex-shrink: 0; }
    .btn-icon { background: rgba(255,255,255,0.06); border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 16px; line-height: 1; }
    .btn-icon:hover { background: rgba(255,255,255,0.12); }
    .btn-danger:hover { background: rgba(244,67,54,0.2); }
    .empty-state { text-align: center; padding: 40px; color: rgba(255,255,255,0.3); }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class FeaturedGamesComponent implements OnInit {
  private admin = inject(AdminService);
  banners = signal<FeaturedBanner[]>([]);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  saving = false;
  generating = false;

  form = {
    title: '',
    subtitle: '',
    description: '',
    ctaLabel: 'Bet Now',
    ctaLink: '/home',
    emoji: '🏆',
    gradientStart: '#E8B923',
    gradientEnd: '#FF6B35',
    isActive: true,
    displayOrder: 0,
    startsAt: '',
    expiresAt: '',
  };

  ngOnInit() {
    this.load();
  }

  load() {
    this.admin.getFeaturedBanners().subscribe(res => {
      if (res.success) this.banners.set(res.data);
    });
  }

  startCreate() {
    this.resetForm();
    this.showForm.set(true);
    this.editingId.set(null);
  }

  startEdit(b: FeaturedBanner) {
    this.form = {
      title: b.title,
      subtitle: b.subtitle || '',
      description: b.description || '',
      ctaLabel: b.ctaLabel || 'Bet Now',
      ctaLink: b.ctaLink || '/home',
      emoji: b.emoji || '🏆',
      gradientStart: b.gradientStart || '#E8B923',
      gradientEnd: b.gradientEnd || '#FF6B35',
      isActive: b.isActive,
      displayOrder: b.displayOrder || 0,
      startsAt: b.startsAt ? b.startsAt.slice(0, 16) : '',
      expiresAt: b.expiresAt ? b.expiresAt.slice(0, 16) : '',
    };
    this.editingId.set(b._id);
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  resetForm() {
    this.form = {
      title: '', subtitle: '', description: '',
      ctaLabel: 'Bet Now', ctaLink: '/home',
      emoji: '🏆', gradientStart: '#E8B923', gradientEnd: '#FF6B35',
      isActive: true, displayOrder: 0, startsAt: '', expiresAt: '',
    };
  }

  save() {
    if (!this.form.title.trim() || this.saving) return;
    this.saving = true;

    const data: any = { ...this.form };
    if (!data.startsAt) delete data.startsAt;
    if (!data.expiresAt) delete data.expiresAt;
    if (data.startsAt) data.startsAt = new Date(data.startsAt).toISOString();
    if (data.expiresAt) data.expiresAt = new Date(data.expiresAt).toISOString();

    const request = this.editingId()
      ? this.admin.updateFeaturedBanner(this.editingId()!, data)
      : this.admin.createFeaturedBanner(data);

    request.subscribe({
      next: () => { this.saving = false; this.showForm.set(false); this.load(); },
      error: () => { this.saving = false; }
    });
  }

  remove(id: string) {
    if (!confirm('Delete this banner?')) return;
    this.admin.deleteFeaturedBanner(id).subscribe({
      next: () => this.load(),
      error: () => {}
    });
  }

  generateDesc() {
    if (!this.form.title.trim() || this.generating) return;
    this.generating = true;
    this.admin.generateBannerDescription(this.form.title, this.form.subtitle || undefined).subscribe({
      next: res => {
        if (res.success) this.form.description = res.data.description;
        this.generating = false;
      },
      error: () => { this.generating = false; }
    });
  }

  trackById(_: number, b: FeaturedBanner) { return b._id; }
}
