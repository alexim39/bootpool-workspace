import { Component, inject } from '@angular/core';
import { DeviceService } from '../../core/services/device.service';
import { ProfileDesktopComponent } from './profile-desktop.component';
import { ProfileMobileComponent } from './mobile/profile-mobile.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ProfileDesktopComponent, ProfileMobileComponent],
  template: `@if (device.isMobile()) { <app-profile-mobile /> } @else { <app-profile-desktop /> }`
})
export class ProfileComponent {
  device = inject(DeviceService);
}
