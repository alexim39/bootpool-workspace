import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'requestLoginOtp',
      'loginWithPin',
      'setAuth',
    ]);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, FormsModule, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('has OTP and PIN tab switcher', () => {
    expect(component.store.loginMode()).toBe('otp');
    const buttons = fixture.nativeElement.querySelectorAll('.tab-btn');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('OTP Login');
    expect(buttons[1].textContent).toContain('PIN Login');
  });

  it('switches to PIN mode on tab click', () => {
    component.store.loginMode.set('pin');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tab-btn.active').textContent).toContain('PIN Login');
  });

  it('disables submit button when phone has fewer than 10 digits', () => {
    component.phone = '123456789';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.btn-primary') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });

  it('enables submit button when phone has 10 digits', () => {
    component.phone = '1234567890';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.btn-primary') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
  });

  it('calls auth.requestLoginOtp on sendOtp', fakeAsync(() => {
    mockAuthService.requestLoginOtp.and.returnValue(of({ success: true }).pipe(delay(0)));
    component.phone = '1234567890';
    fixture.detectChanges();

    component.sendOtp();
    tick();

    expect(mockAuthService.requestLoginOtp).toHaveBeenCalledWith('1234567890');
  }));

  it('navigates to verify-otp on successful OTP send', fakeAsync(() => {
    mockAuthService.requestLoginOtp.and.returnValue(of({ success: true }).pipe(delay(0)));
    component.phone = '1234567890';

    component.sendOtp();
    tick();

    expect(router.navigate).toHaveBeenCalledWith(
      ['/auth/verify-otp'],
      jasmine.objectContaining({ state: jasmine.objectContaining({ phone: '1234567890', purpose: 'login' }) })
    );
  }));

  it('sets error on OTP send failure', fakeAsync(() => {
    mockAuthService.requestLoginOtp.and.returnValue(
      throwError(() => ({ error: { message: 'Too many requests' } }))
    );
    component.phone = '1234567890';

    component.sendOtp();
    tick();

    expect(component.store.error()).toBe('Too many requests');
  }));

  it('shows loading state while sending OTP', fakeAsync(() => {
    mockAuthService.requestLoginOtp.and.returnValue(of({ success: true }).pipe(delay(0)));
    component.phone = '1234567890';

    component.sendOtp();
    expect(component.store.loading()).toBeTrue();
    tick();
    expect(component.store.loading()).toBeFalse();
  }));

  it('validates PIN login - disables button when PIN < 4 chars', () => {
    component.store.loginMode.set('pin');
    component.phone = '1234567890';
    component.pin = '123';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.btn-primary') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });

  it('enables PIN login button with valid phone and PIN', () => {
    component.store.loginMode.set('pin');
    component.phone = '1234567890';
    component.pin = '1234';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.btn-primary') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
  });

  it('calls loginWithPin on PIN mode submit', fakeAsync(() => {
    mockAuthService.loginWithPin.and.returnValue(
      of({ success: true, data: { token: 'tok', user: { id: 'u1' } as any }, token: 'tok', user: { id: 'u1' } as any }).pipe(delay(0))
    );
    component.store.loginMode.set('pin');
    component.phone = '1234567890';
    component.pin = '1234';

    component.loginWithPin();
    tick();

    expect(mockAuthService.loginWithPin).toHaveBeenCalledWith('1234567890', '1234');
  }));

  it('sets auth and navigates to home on PIN login success', fakeAsync(() => {
    mockAuthService.loginWithPin.and.returnValue(
      of({ success: true, data: { token: 'tok', user: { id: 'u1', phone: '1234567890', fullName: 'Test', phoneVerified: true, kycVerified: false, referralCode: '', createdAt: '' } }, token: 'tok', user: { id: 'u1', phone: '1234567890', fullName: 'Test', phoneVerified: true, kycVerified: false, referralCode: '', createdAt: '' } }).pipe(delay(0))
    );
    component.store.loginMode.set('pin');
    component.phone = '1234567890';
    component.pin = '1234';

    component.loginWithPin();
    tick();

    expect(mockAuthService.setAuth).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  }));
});
