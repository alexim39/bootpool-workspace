import { Component, inject } from '@angular/core';
import { DeviceService } from '../../../core/services';
import { TransferDesktopComponent } from './pages/transfer-desktop/transfer-desktop.component';
import { TransferMobileComponent } from './pages/transfer-mobile/transfer-mobile.component';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [TransferDesktopComponent, TransferMobileComponent],
  template: `@if (device.isMobile()) { <app-transfer-mobile /> } @else { <app-transfer-desktop /> }`
})
export class TransferComponent {
  device = inject(DeviceService);
}