import { Component, inject } from '@angular/core';
import { DeviceService } from '../../../core/services/device.service';
import { WithdrawDesktopComponent } from './withdraw-desktop.component';
import { WithdrawMobileComponent } from './withdraw-mobile.component';

@Component({
  selector: 'app-withdraw',
  standalone: true,
  imports: [WithdrawDesktopComponent, WithdrawMobileComponent],
  template: `@if (device.isMobile()) { <app-withdraw-mobile /> } @else { <app-withdraw-desktop /> }`
})
export class WithdrawComponent {
  device = inject(DeviceService);
}
