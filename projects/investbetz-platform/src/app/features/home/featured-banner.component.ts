import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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
  template: `
    <div class="banner-root" *ngIf="banners().length > 0">
      <div class="carousel-track" #track [style.transform]="'translateX(-' + currentIndex() * 100 + '%)'">
        <a
          *ngFor="let banner of banners(); trackBy: trackById"
          [routerLink]="banner.ctaLink"
          class="featured-card"
          [style.--grad-start]="banner.gradientStart"
          [style.--grad-end]="banner.gradientEnd"
          (touchstart)="onTouchStart($event)"
          (touchmove)="onTouchMove($event)"
          (touchend)="onTouchEnd($event)"
        >
          <div class="card-shine"></div>
          <div class="card-bg-emoji">{{ banner.emoji }}</div>
          <div class="card-grid"></div>

          <div class="card-badge">
            <span class="badge-dot"></span>
            Featured
          </div>

          <div class="card-body">
            <div class="card-text">
              <div class="card-title">{{ banner.title }}</div>
              <div class="card-subtitle" *ngIf="banner.subtitle">{{ banner.subtitle }}</div>
              <div class="card-desc" *ngIf="banner.description">{{ banner.description }}</div>
            </div>

            <div class="card-cta">
              <span class="cta-btn">
                <span>{{ banner.ctaLabel }}</span>
                <svg class="cta-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 3L9 7L5 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </div>
          </div>
        </a>
      </div>

      <div class="carousel-dots" *ngIf="banners().length > 1">
        <button
          *ngFor="let b of banners(); let i = index"
          class="dot"
          [class.active]="i === currentIndex()"
          (click)="currentIndex.set(i)"
          attr.aria-label="Slide {{ i + 1 }}"
        ></button>
      </div>
    </div>
  `,
  styles: [`
    .banner-root {
      position: relative;
      overflow: hidden;
      margin: 0 32px 20px;
      border-radius: 20px;
    }
    .carousel-track {
      display: flex;
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform;
    }
    .carousel-track > a { min-width: 100%; }

    .featured-card {
      position: relative;
      display: flex;
      flex-direction: column;
      border-radius: 20px;
      overflow: hidden;
      text-decoration: none;
      cursor: pointer;
      min-height: 160px;
      background: linear-gradient(135deg, var(--grad-start), var(--grad-end));
      background-size: 200% 200%;
      animation: gradShift 6s ease-in-out infinite alternate;
    }
    @keyframes gradShift {
      0% { background-position: 0% 0%; }
      100% { background-position: 100% 100%; }
    }
    .featured-card:active { transform: scale(0.98); }

    .card-shine {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        105deg,
        transparent 30%,
        rgba(255,255,255,0.12) 45%,
        rgba(255,255,255,0.18) 50%,
        rgba(255,255,255,0.12) 55%,
        transparent 70%
      );
      background-size: 300% 100%;
      animation: shine 4s ease-in-out infinite;
      pointer-events: none;
      z-index: 2;
    }
    @keyframes shine {
      0% { background-position: 200% 0; }
      60% { background-position: -80% 0; }
      100% { background-position: -80% 0; }
    }

    .card-bg-emoji {
      position: absolute;
      right: -8px;
      bottom: -12px;
      font-size: 110px;
      line-height: 1;
      opacity: 0.13;
      pointer-events: none;
      z-index: 1;
      user-select: none;
    }

    .card-grid {
      position: absolute;
      inset: 0;
      opacity: 0.06;
      background-image:
        linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px);
      background-size: 32px 32px;
      pointer-events: none;
      z-index: 1;
    }

    .card-badge {
      position: absolute;
      top: 14px;
      left: 16px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px 4px 10px;
      border-radius: 9999px;
      background: rgba(0,0,0,0.25);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.15);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      z-index: 3;
    }
    .badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #00E676;
      box-shadow: 0 0 6px rgba(0,230,118,0.6);
      animation: dotPulse 1.8s ease-in-out infinite;
    }
    @keyframes dotPulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(0,230,118,0.6); }
      50% { opacity: 0.5; box-shadow: 0 0 10px rgba(0,230,118,0.2); }
    }

    .card-body {
      position: relative;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      padding: 56px 24px 22px;
      z-index: 3;
      flex: 1;
    }

    .card-text { flex: 1; min-width: 0; }
    .card-title {
      color: #fff;
      font-size: 22px;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.3px;
    }
    .card-subtitle {
      color: rgba(255,255,255,0.9);
      font-size: 15px;
      font-weight: 600;
      margin-top: 3px;
      letter-spacing: 0.1px;
    }
    .card-desc {
      color: rgba(255,255,255,0.7);
      font-size: 13px;
      margin-top: 6px;
      line-height: 1.5;
      max-width: 480px;
    }

    .card-cta { flex-shrink: 0; }
    .cta-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 22px;
      border-radius: 12px;
      background: rgba(255,255,255,0.18);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.25);
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      white-space: nowrap;
      transition: all 0.2s ease;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    .featured-card:hover .cta-btn {
      background: rgba(255,255,255,0.28);
      border-color: rgba(255,255,255,0.4);
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(0,0,0,0.25);
    }
    .cta-arrow { transition: transform 0.2s ease; }
    .featured-card:hover .cta-arrow { transform: translateX(3px); }

    .carousel-dots {
      display: flex;
      justify-content: center;
      gap: 8px;
      padding: 10px 0 4px;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      border: none;
      background: rgba(255,255,255,0.2);
      cursor: pointer;
      transition: all 0.3s ease;
      padding: 0;
    }
    .dot.active {
      width: 22px;
      border-radius: 3px;
      background: rgba(255,255,255,0.6);
    }

    @media (max-width: 640px) {
      .banner-root {
        margin: 0 0 14px;
        border-radius: 0;
      }
      .featured-card {
        min-height: 140px;
        border-radius: 0;
      }
      .card-bg-emoji {
        font-size: 80px;
        right: -4px;
        bottom: -8px;
        opacity: 0.1;
      }
      .card-badge {
        top: 10px;
        left: 12px;
        padding: 3px 10px 3px 8px;
        font-size: 10px;
      }
      .badge-dot { width: 6px; height: 6px; }
      .card-body {
        padding: 46px 16px 16px;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .card-title { font-size: 18px; }
      .card-subtitle { font-size: 13px; }
      .card-desc { font-size: 12px; margin-top: 4px; }
      .cta-btn {
        padding: 8px 18px;
        font-size: 13px;
        border-radius: 10px;
      }
      .carousel-dots { padding: 8px 0 2px; gap: 6px; }
      .dot { width: 5px; height: 5px; }
      .dot.active { width: 18px; }
    }
  `]
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
