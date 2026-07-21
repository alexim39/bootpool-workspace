import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SignupComponent } from './signup.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

describe('SignupComponent', () => {
  let fixture: ComponentFixture<SignupComponent>;
  let component: SignupComponent;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['requestSignupOtp']);

    await TestBed.configureTestingModule({
      imports: [SignupComponent, FormsModule, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('validates phone - isFormValid false when phone < 10 chars', () => {
    component.fullName = 'Test User';
    component.phone = '123456789';
    component.termsAccepted = true;
    expect(component.isFormValid).toBeFalse();
  });

  it('validates name - isFormValid false when name < 2 chars', () => {
    component.fullName = 'A';
    component.phone = '1234567890';
    component.termsAccepted = true;
    expect(component.isFormValid).toBeFalse();
  });

  it('validates terms - isFormValid false when terms not accepted', () => {
    component.fullName = 'Test User';
    component.phone = '1234567890';
    component.termsAccepted = false;
    expect(component.isFormValid).toBeFalse();
  });

  it('isFormValid true when all fields are valid', () => {
    component.fullName = 'Test User';
    component.phone = '1234567890';
    component.termsAccepted = true;
    expect(component.isFormValid).toBeTrue();
  });

  it('toggles terms acceptance', () => {
    expect(component.termsAccepted).toBeFalse();
    component.toggleTerms();
    expect(component.termsAccepted).toBeTrue();
    component.toggleTerms();
    expect(component.termsAccepted).toBeFalse();
  });

  it('disables submit button when form is invalid', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.btn-primary') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });

  it('enables submit button when form is valid', () => {
    component.fullName = 'Test User';
    component.phone = '1234567890';
    component.termsAccepted = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.btn-primary') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
  });

  it('calls requestSignupOtp on createAccount', fakeAsync(() => {
    mockAuthService.requestSignupOtp.and.returnValue(of({ success: true }).pipe(delay(0)));
    component.fullName = 'Test User';
    component.phone = '1234567890';
    component.termsAccepted = true;

    component.createAccount();
    tick();

    expect(mockAuthService.requestSignupOtp).toHaveBeenCalledWith('1234567890');
  }));

  it('does not call API when form is invalid', () => {
    component.createAccount();
    expect(mockAuthService.requestSignupOtp).not.toHaveBeenCalled();
  });

  it('navigates to verify-otp on success', fakeAsync(() => {
    mockAuthService.requestSignupOtp.and.returnValue(of({ success: true }).pipe(delay(0)));
    component.fullName = 'Test User';
    component.phone = '1234567890';
    component.termsAccepted = true;

    component.createAccount();
    tick();

    expect(router.navigate).toHaveBeenCalledWith(
      ['/auth/verify-otp'],
      jasmine.objectContaining({
        state: jasmine.objectContaining({ phone: '1234567890', fullName: 'Test User', purpose: 'signup' }),
      })
    );
  }));

  it('shows loading state during submission', fakeAsync(() => {
    mockAuthService.requestSignupOtp.and.returnValue(of({ success: true }).pipe(delay(0)));
    component.fullName = 'Test User';
    component.phone = '1234567890';
    component.termsAccepted = true;

    component.createAccount();
    expect(component.loading()).toBeTrue();
    tick();
    expect(component.loading()).toBeFalse();
  }));

  it('sets error on API failure', fakeAsync(() => {
    mockAuthService.requestSignupOtp.and.returnValue(
      throwError(() => ({ error: { message: 'Phone already registered' } }))
    );
    component.fullName = 'Test User';
    component.phone = '1234567890';
    component.termsAccepted = true;

    component.createAccount();
    tick();

    expect(component.error()).toBe('Phone already registered');
  }));
});
