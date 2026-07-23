import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal, WritableSignal } from '@angular/core';
import { HomeComponent } from './home.component';
import { DeviceService } from '../../core/services';
import { HomeDesktopComponent } from './pages/home-desktop/home-desktop.component';
import { HomeMobileComponent } from './pages/home-mobile/home-mobile.component';

@Component({ selector: 'app-home-desktop', standalone: true, template: '' })
class MockHomeDesktopComponent {}

@Component({ selector: 'app-home-mobile', standalone: true, template: '' })
class MockHomeMobileComponent {}

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let mockIsMobile: WritableSignal<boolean>;
  let mockIsTablet: WritableSignal<boolean>;

  beforeEach(async () => {
    mockIsMobile = signal(false);
    mockIsTablet = signal(false);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
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
      .overrideComponent(HomeComponent, {
        remove: { imports: [HomeDesktopComponent, HomeMobileComponent] },
        add: { imports: [MockHomeDesktopComponent, MockHomeMobileComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders app-home-desktop when desktop', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-home-desktop')).toBeTruthy();
    expect(el.querySelector('app-home-mobile')).toBeFalsy();
  });

  it('renders app-home-mobile when mobile', () => {
    mockIsMobile.set(true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-home-mobile')).toBeTruthy();
    expect(el.querySelector('app-home-desktop')).toBeFalsy();
  });

  it('renders app-home-mobile when tablet', () => {
    mockIsTablet.set(true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-home-mobile')).toBeTruthy();
    expect(el.querySelector('app-home-desktop')).toBeFalsy();
  });

  it('computes isMobile based on device service', () => {
    expect(component.isMobile()).toBeFalse();
    mockIsMobile.set(true);
    expect(component.isMobile()).toBeTrue();
    mockIsMobile.set(false);
    mockIsTablet.set(true);
    expect(component.isMobile()).toBeTrue();
  });
});
