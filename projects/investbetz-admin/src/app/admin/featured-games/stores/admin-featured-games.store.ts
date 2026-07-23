import { Injectable, inject, signal } from '@angular/core';
import { AdminService, FeaturedBanner } from '../../services';

@Injectable({ providedIn: 'root' })
export class AdminFeaturedGamesStore {
  private admin = inject(AdminService);

  readonly banners = signal<FeaturedBanner[]>([]);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly generating = signal(false);

  load() {
    this.admin.getFeaturedBanners().subscribe(res => {
      if (res.success) this.banners.set(res.data);
    });
  }

  startCreate() {
    this.showForm.set(true);
    this.editingId.set(null);
  }

  startEdit(b: FeaturedBanner) {
    this.editingId.set(b._id);
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(data: Partial<FeaturedBanner>) {
    if (!data.title?.trim() || this.saving()) return;
    this.saving.set(true);

    const payload: any = { ...data };
    if (payload.startsAt) payload.startsAt = new Date(payload.startsAt).toISOString();
    if (payload.expiresAt) payload.expiresAt = new Date(payload.expiresAt).toISOString();

    const request = this.editingId()
      ? this.admin.updateFeaturedBanner(this.editingId()!, payload)
      : this.admin.createFeaturedBanner(payload);

    request.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.load(); },
      error: () => { this.saving.set(false); }
    });
  }

  remove(id: string) {
    this.admin.deleteFeaturedBanner(id).subscribe({
      next: () => this.load(),
      error: () => {}
    });
  }

  generateDesc(title: string, subtitle: string | undefined, onDescription: (desc: string) => void) {
    if (!title.trim() || this.generating()) return;
    this.generating.set(true);
    this.admin.generateBannerDescription(title, subtitle).subscribe({
      next: res => {
        if (res.success) onDescription(res.data.description);
        this.generating.set(false);
      },
      error: () => { this.generating.set(false); }
    });
  }
}
