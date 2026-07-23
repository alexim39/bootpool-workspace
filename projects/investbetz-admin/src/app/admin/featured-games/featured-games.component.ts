import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeaturedBanner } from '../services';
import { AdminFeaturedGamesStore } from './stores/admin-featured-games.store';

@Component({
  selector: 'app-featured-games',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './featured-games.component.html',
  styleUrls: ['./featured-games.component.scss']
})
export class FeaturedGamesComponent implements OnInit {
  readonly store = inject(AdminFeaturedGamesStore);

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
    this.store.load();
  }

  startCreate() {
    this.resetForm();
    this.store.startCreate();
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
    this.store.startEdit(b);
  }

  cancelForm() {
    this.store.cancelForm();
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
    const data: any = { ...this.form };
    if (!data.startsAt) delete data.startsAt;
    if (!data.expiresAt) delete data.expiresAt;
    this.store.save(data);
  }

  remove(id: string) {
    if (!confirm('Delete this banner?')) return;
    this.store.remove(id);
  }

  generateDesc() {
    this.store.generateDesc(this.form.title, this.form.subtitle || undefined, (desc) => {
      this.form.description = desc;
    });
  }

  trackById(_: number, b: FeaturedBanner) { return b._id; }
}
