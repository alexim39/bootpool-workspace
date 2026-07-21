import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { DeviceService } from '../../core/services/device.service';

const isDesktop = () => {
  const device = inject(DeviceService);
  if (typeof window !== 'undefined') {
    return window.innerWidth >= 1024;
  }
  return device.isDesktop();
};

export const authRoutes: Routes = [
  {
    path: 'login',
    canMatch: [isDesktop],
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./mobile/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    canMatch: [isDesktop],
    loadComponent: () => import('./signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./mobile/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'verify-otp',
    canMatch: [isDesktop],
    loadComponent: () => import('./otp-verify/otp-verify.component').then(m => m.OtpVerifyComponent)
  },
  {
    path: 'verify-otp',
    loadComponent: () => import('./mobile/otp-verify/otp-verify.component').then(m => m.OtpVerifyComponent)
  },
  {
    path: 'setup-pin',
    canMatch: [isDesktop],
    loadComponent: () => import('./pin-setup/pin-setup.component').then(m => m.PinSetupComponent)
  },
  {
    path: 'setup-pin',
    loadComponent: () => import('./mobile/pin-setup/pin-setup.component').then(m => m.PinSetupComponent)
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
