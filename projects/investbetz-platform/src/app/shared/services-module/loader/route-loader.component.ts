import { Component, signal, DestroyRef, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-route-loader',
  standalone: true,
  templateUrl: './route-loader.component.html',
  styleUrls: ['./route-loader.component.scss']
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
