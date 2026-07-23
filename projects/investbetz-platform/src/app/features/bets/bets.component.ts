import { Component, inject } from '@angular/core';
import { DeviceService } from '../../core/services';
import { BetsDesktopComponent } from './pages/bets-desktop/bets-desktop.component';
import { BetsMobileComponent } from './pages/bets-mobile/bets-mobile.component';

@Component({
  selector: 'app-bets',
  standalone: true,
  imports: [BetsDesktopComponent, BetsMobileComponent],
  template: `@if (device.isMobile()) { <app-bets-mobile /> } @else { <app-bets-desktop /> }`
})
export class BetsComponent {
  device = inject(DeviceService);
}
