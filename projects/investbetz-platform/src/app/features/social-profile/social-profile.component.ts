import { Component, inject } from '@angular/core';
import { DeviceService } from '../../core/services';
import { SocialProfileDesktopComponent } from './pages/social-profile-desktop/social-profile-desktop.component';
import { SocialProfileMobileComponent } from './pages/social-profile-mobile/social-profile-mobile.component';

@Component({
  selector: 'app-social-profile',
  standalone: true,
  imports: [SocialProfileDesktopComponent, SocialProfileMobileComponent],
  template: `@if (device.isMobile()) { <app-social-profile-mobile /> } @else { <app-social-profile-desktop /> }`
})
export class SocialProfileComponent {
  device = inject(DeviceService);
}