import { Component, inject } from '@angular/core';
import { DeviceService } from '../../core/services/device.service';
import { WalletDesktopComponent } from './wallet-desktop.component';
import { WalletMobileComponent } from './mobile/wallet-mobile.component';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [WalletDesktopComponent, WalletMobileComponent],
  template: `@if (device.isMobile()) { <app-wallet-mobile /> } @else { <app-wallet-desktop /> }`
})
export class WalletComponent {
  device = inject(DeviceService);
}
