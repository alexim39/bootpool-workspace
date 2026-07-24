import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { DeviceService } from '../../core/services';

const isDesktop = () => inject(DeviceService).isDesktop();

export const BET_MANAGER_ROUTES: Routes = [
  {
    path: '',
    canMatch: [isDesktop],
    loadComponent: () => import('./pages/overview/bet-manager-overview.component').then(m => m.BetManagerOverviewComponent),
  },
  {
    path: '',
    loadComponent: () => import('./pages/overview/mobile/bet-manager-overview.component').then(m => m.BetManagerOverviewComponent),
  },
  {
    path: ':tier',
    canMatch: [isDesktop],
    loadComponent: () => import('./pages/detail/bet-manager-detail.component').then(m => m.BetManagerDetailComponent),
  },
  {
    path: ':tier',
    loadComponent: () => import('./pages/detail/mobile/bet-manager-detail.component').then(m => m.BetManagerDetailComponent),
  },
  {
    path: 'deposit/:tier',
    canMatch: [isDesktop],
    loadComponent: () => import('./pages/deposit/bet-manager-deposit.component').then(m => m.BetManagerDepositComponent),
  },
  {
    path: 'deposit/:tier',
    loadComponent: () => import('./pages/deposit/mobile/bet-manager-deposit.component').then(m => m.BetManagerDepositComponent),
  },
];
