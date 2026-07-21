import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '../../core/services/device.service';
import { HomeDesktopComponent } from './home-desktop.component';
import { HomeMobileComponent } from './mobile/home-mobile.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HomeDesktopComponent, HomeMobileComponent],
  template: `@if (isMobile()) { <app-home-mobile /> } @else { <app-home-desktop /> }`
})
export class HomeComponent {
  private device = inject(DeviceService);
  isMobile = computed(() => this.device.isMobile() || this.device.isTablet());
}
