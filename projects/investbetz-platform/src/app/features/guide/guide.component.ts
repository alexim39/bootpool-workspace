import { Component, inject } from '@angular/core';
import { DeviceService } from '../../core/services';
import { GuideDesktopComponent } from './pages/guide-desktop/guide-desktop.component';
import { GuideMobileComponent } from './pages/guide-mobile/guide-mobile.component';

@Component({
  selector: 'app-guide',
  standalone: true,
  imports: [GuideDesktopComponent, GuideMobileComponent],
  template: `@if (device.isMobile()) { <app-guide-mobile /> } @else { <app-guide-desktop /> }`
})
export class GuideComponent {
  readonly device = inject(DeviceService);
}
