// device.service.ts
import { Injectable, computed, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, distinctUntilChanged, startWith } from 'rxjs';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface DeviceState {
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isDesktop: boolean;
  readonly type: DeviceType;
  readonly orientation: 'portrait' | 'landscape';
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);

  // Internal signals
  private readonly _isMobile = signal<boolean>(false);
  private readonly _isTablet = signal<boolean>(false);
  private readonly _orientation = signal<'portrait' | 'landscape'>('landscape');

  // Public readonly signals
  readonly isMobile = this._isMobile.asReadonly();
  readonly isTablet = this._isTablet.asReadonly();
  readonly isDesktop = computed(() => !this._isMobile() && !this._isTablet());
  
  readonly type = computed((): DeviceType => {
    if (this._isMobile()) return 'mobile';
    if (this._isTablet()) return 'tablet';
    return 'desktop';
  });

  readonly orientation = this._orientation.asReadonly();

  // Complete device state as computed signal
  readonly deviceState = computed((): DeviceState => ({
    isMobile: this.isMobile(),
    isTablet: this.isTablet(),
    isDesktop: this.isDesktop(),
    type: this.type(),
    orientation: this.orientation()
  }));

  constructor() {
    this.initializeBreakpointObservation();
  }

  private initializeBreakpointObservation(): void {
    // Mobile breakpoint observation
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(
        map(result => result.matches),
        distinctUntilChanged(),
        startWith(false),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(isMobile => this._isMobile.set(isMobile));

    // Tablet breakpoint observation
    this.breakpointObserver
      .observe([Breakpoints.Tablet])
      .pipe(
        map(result => result.matches),
        distinctUntilChanged(),
        startWith(false),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(isTablet => this._isTablet.set(isTablet));

    // Orientation observation
    this.breakpointObserver
      .observe(['(orientation: portrait)'])
      .pipe(
        map(result => result.matches ? 'portrait' : 'landscape' as const),
        distinctUntilChanged(),
        startWith('landscape' as const),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(orientation => this._orientation.set(orientation));
  }

  // Utility methods for common use cases
  isMobileOrTablet(): boolean {
    return this.isMobile() || this.isTablet();
  }

  isSmallScreen(): boolean {
    return this.isMobile();
  }

  isMediumScreen(): boolean {
    return this.isTablet();
  }

  isLargeScreen(): boolean {
    return this.isDesktop();
  }
}