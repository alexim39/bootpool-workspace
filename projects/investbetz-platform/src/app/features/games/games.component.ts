import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '../../core/services';
import { GamesDesktopComponent } from './pages/games-desktop/games-desktop.component';
import { GamesMobileComponent } from './pages/games-mobile/games-mobile.component';

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule, GamesDesktopComponent, GamesMobileComponent],
  template: `@if (isMobile()) { <app-games-mobile /> } @else { <app-games-desktop /> }`
})
export class GamesComponent {
  private device = inject(DeviceService);
  isMobile = computed(() => this.device.isMobile() || this.device.isTablet());
}
