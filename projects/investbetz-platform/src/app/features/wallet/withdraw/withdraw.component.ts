import { Component, inject } from '@angular/core';
import { DeviceService } from '../../../core/services';
import { WithdrawDesktopComponent } from './pages/withdraw-desktop/withdraw-desktop.component';
import { WithdrawMobileComponent } from './pages/withdraw-mobile/withdraw-mobile.component';

@Component({
  selector: 'app-withdraw',
  standalone: true,
  imports: [WithdrawDesktopComponent, WithdrawMobileComponent],
  template: `@if (device.isMobile()) { <app-withdraw-mobile /> } @else { <app-withdraw-desktop /> }`
})
export class WithdrawComponent {
  device = inject(DeviceService);
}
