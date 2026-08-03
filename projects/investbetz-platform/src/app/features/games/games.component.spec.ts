import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal, WritableSignal } from '@angular/core';
import { GamesComponent } from './games.component';
import { DeviceService } from '../../core/services';
import { GamesDesktopComponent } from './pages/games-desktop/games-desktop.component';
import { GamesMobileComponent } from './pages/games-mobile/games-mobile.component';

@Component({ selector: 'app-games-desktop', standalone: true, template: '' })
class MockGamesDesktopComponent {}

@Component({ selector: 'app-games-mobile', standalone: true, template: '' })
class MockGamesMobileComponent {}

describe('GamesComponent', () => {
  let fixture: ComponentFixture<GamesComponent>;
  let component: GamesComponent;
  let mockIsMobile: WritableSignal<boolean>;
  let mockIsTablet: WritableSignal<boolean>;

  beforeEach(async () => {
    mockIsMobile = signal(false);
    mockIsTablet = signal(false);

    await TestBed.configureTestingModule({
      imports: [GamesComponent],
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
      .overrideComponent(GamesComponent, {
        remove: { imports: [GamesDesktopComponent, GamesMobileComponent] },
        add: { imports: [MockGamesDesktopComponent, MockGamesMobileComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(GamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders app-games-desktop when desktop', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-games-desktop')).toBeTruthy();
    expect(el.querySelector('app-games-mobile')).toBeFalsy();
  });

  it('renders app-games-mobile when mobile', () => {
    mockIsMobile.set(true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-games-mobile')).toBeTruthy();
    expect(el.querySelector('app-games-desktop')).toBeFalsy();
  });

  it('renders app-games-mobile when tablet', () => {
    mockIsTablet.set(true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-games-mobile')).toBeTruthy();
    expect(el.querySelector('app-games-desktop')).toBeFalsy();
  });
});
