import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

export interface FeaturedBanner {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
  ctaLabel: string;
  ctaLink: string;
  emoji: string;
  gradientStart: string;
  gradientEnd: string;
  isActive: boolean;
  displayOrder: number;
}

@Component({
  selector: 'app-featured-banner',
  standalone: true,
  imports: [NgIf, NgFor, RouterModule],
  templateUrl: './featured-banner.component.html',
  styleUrls: ['./featured-banner.component.scss']
})
export class FeaturedBannerComponent implements OnInit {
  private http = inject(HttpClient);
  banners = signal<FeaturedBanner[]>([]);
  currentIndex = signal(0);

  private touchStartX = 0;
  private touchEndX = 0;

  ngOnInit() {
    this.http.get<{ success: boolean; data: FeaturedBanner[] }>(`${environment.apiUrl}/featured-games`).subscribe({
      next: res => { if (res.success) this.banners.set(res.data); },
      error: () => {}
    });
  }

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.touches[0].clientX;
  }
  onTouchMove(e: TouchEvent) {
    this.touchEndX = e.touches[0].clientX;
  }
  onTouchEnd(_e: TouchEvent) {
    const diff = this.touchStartX - this.touchEndX;
    const len = this.banners().length;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && this.currentIndex() < len - 1) {
        this.currentIndex.set(this.currentIndex() + 1);
      } else if (diff < 0 && this.currentIndex() > 0) {
        this.currentIndex.set(this.currentIndex() - 1);
      }
    }
  }

  trackById(_: number, b: FeaturedBanner) { return b._id; }
}
