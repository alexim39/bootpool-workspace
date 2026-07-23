import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandingDesktopComponent } from './landing-desktop.component';
import { LandingMobileComponent } from './mobile/landing-mobile.component';
import { DeviceService } from '../../core/services';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, LandingDesktopComponent, LandingMobileComponent],
  template: `@if (isMobile()) { <app-landing-mobile /> } @else { <app-landing-desktop /> }`
})
export class LandingComponent implements OnInit {
  private device = inject(DeviceService);
  isMobile = computed(() => this.device.isMobile() || this.device.isTablet());

  ngOnInit() {
    if (typeof document !== 'undefined') {
      document.title = 'BetPool Nigeria — Bet on Sports Without Losing Your Stake';
      const setMeta = (name: string, content: string) => {
        let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        if (el) el.setAttribute('content', content);
      };
      setMeta('description', 'BetPool lets you back predictions on real matches without risking your stake. If our pick loses, you get your money back. Join thousands betting smarter in Nigeria.');
      setMeta('keywords', 'betting Nigeria, sports betting, BetPool, risk-free betting, stake refund, Nigerian betting platform');
      setMeta('og:title', 'BetPool Nigeria — Bet on Sports Without Losing Your Stake');
      setMeta('og:description', 'Back predictions on real matches. If our pick loses, you get your money back.');
      setMeta('twitter:title', 'BetPool Nigeria — Risk-Free Sports Betting');
      setMeta('twitter:description', 'If our pick loses, you get your stake back. Join thousands betting smarter.');
    }
  }
}
