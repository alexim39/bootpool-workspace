import { Component, signal, DestroyRef, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-route-loader',
  standalone: true,
  template: `
    @if (loading()) {
      <div class="route-progress"><div class="route-progress-bar"></div></div>
    }
  `,
  styles: [`
    .route-progress {
      position: fixed; top: 0; left: 0; width: 100%; height: 3px;
      z-index: 999999; overflow: hidden; background: transparent;
    }
    .route-progress-bar {
      height: 100%; width: 40%;
      background: linear-gradient(90deg, #00E676, #D4AF37);
      animation: route-slide 1.2s ease-in-out infinite;
      border-radius: 0 3px 3px 0;
    }
    @keyframes route-slide {
      0% { transform: translateX(-100%); }
      50% { transform: translateX(150%); }
      100% { transform: translateX(400%); }
    }
  `]
})
export class RouteLoaderComponent {
  loading = signal(false);

  constructor() {
    const router = inject(Router);
    const destroyRef = inject(DestroyRef);

    router.events.pipe(takeUntilDestroyed(destroyRef)).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loading.set(true);
      } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.loading.set(false);
      }
    });
  }
}
