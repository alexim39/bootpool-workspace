import { Component, OnInit, OnDestroy, signal, inject, effect } from '@angular/core';
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
export class FeaturedBannerComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  banners = signal<FeaturedBanner[]>([]);
  currentIndex = signal(0);

  private readonly AUTO_MS = 14000;
  private timer: ReturnType<typeof setInterval> | null = null;
  private touchStartX = 0;
  private touchEndX = 0;

  private bannerWatcher = effect(() => {
    if (this.banners().length > 0) this.startAuto();
  });

  ngOnInit() {
    this.http.get<{ success: boolean; data: FeaturedBanner[] }>(`${environment.apiUrl}/featured-games`).subscribe({
      next: res => { if (res.success) this.banners.set(res.data); },
      error: () => {}
    });
  }

  ngOnDestroy() {
    this.stopAuto();
  }

  goTo(i: number) {
    const len = this.banners().length;
    if (len === 0) return;
    this.currentIndex.set((i + len) % len);
    this.startAuto();
  }

  next() { this.goTo(this.currentIndex() + 1); }

  prev() { this.goTo(this.currentIndex() - 1); }

  private startAuto() {
    this.stopAuto();
    if (this.banners().length < 2) return;
    this.timer = setInterval(() => {
      this.currentIndex.set((this.currentIndex() + 1) % this.banners().length);
    }, this.AUTO_MS);
  }

  private stopAuto() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  pause() { this.stopAuto(); }

  resume() { this.startAuto(); }

  onTouchStart(e: TouchEvent) {
    this.pause();
    this.touchStartX = e.touches[0].clientX;
  }
  onTouchMove(e: TouchEvent) {
    this.touchEndX = e.touches[0].clientX;
  }
  onTouchEnd(_e: TouchEvent) {
    const diff = this.touchStartX - this.touchEndX;
    const len = this.banners().length;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        this.next();
      } else {
        this.prev();
      }
    } else {
      this.resume();
    }
  }

  trackById(_: number, b: FeaturedBanner) { return b._id; }
}
