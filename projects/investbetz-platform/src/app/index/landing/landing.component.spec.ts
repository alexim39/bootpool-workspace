import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal, WritableSignal } from '@angular/core';
import { LandingComponent } from './landing.component';
import { DeviceService } from '../../core/services/device.service';
import { LandingDesktopComponent } from './landing-desktop.component';
import { LandingMobileComponent } from './mobile/landing-mobile.component';

@Component({ selector: 'app-landing-desktop', standalone: true, template: '' })
class MockLandingDesktopComponent {}

@Component({ selector: 'app-landing-mobile', standalone: true, template: '' })
class MockLandingMobileComponent {}

describe('LandingComponent', () => {
  let fixture: ComponentFixture<LandingComponent>;
  let component: LandingComponent;
  let mockIsMobile: WritableSignal<boolean>;
  let mockIsTablet: WritableSignal<boolean>;

  beforeEach(async () => {
    mockIsMobile = signal(false);
    mockIsTablet = signal(false);

    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        {
          provide: DeviceService,
          useValue: {
            isMobile: mockIsMobile.asReadonly(),
            isTablet: mockIsTablet.asReadonly(),
          } as Partial<DeviceService>,
        },
      ],
    })
      .overrideComponent(LandingComponent, {
        remove: { imports: [LandingDesktopComponent, LandingMobileComponent] },
        add: { imports: [MockLandingDesktopComponent, MockLandingMobileComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders app-landing-desktop when desktop', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-landing-desktop')).toBeTruthy();
    expect(el.querySelector('app-landing-mobile')).toBeFalsy();
  });

  it('renders app-landing-mobile when mobile', () => {
    mockIsMobile.set(true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-landing-mobile')).toBeTruthy();
    expect(el.querySelector('app-landing-desktop')).toBeFalsy();
  });

  it('renders app-landing-mobile when tablet', () => {
    mockIsTablet.set(true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-landing-mobile')).toBeTruthy();
    expect(el.querySelector('app-landing-desktop')).toBeFalsy();
  });

  it('uses DeviceService to determine isMobile', () => {
    expect(component.isMobile()).toBeFalse();
    mockIsMobile.set(true);
    expect(component.isMobile()).toBeTrue();
  });

  it('returns true for isMobile when tablet', () => {
    mockIsTablet.set(true);
    expect(component.isMobile()).toBeTrue();
  });
});
