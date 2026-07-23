import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./index/landing/landing.component').then(m => m.LandingComponent),
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes),
    canActivate: [guestGuard]
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'wallet',
    loadComponent: () => import('./features/wallet/wallet.component').then(m => m.WalletComponent),
    canActivate: [authGuard]
  },
  {
    path: 'wallet/withdraw',
    loadComponent: () => import('./features/wallet/withdraw/withdraw.component').then(m => m.WithdrawComponent),
    canActivate: [authGuard]
  },
  {
    path: 'wallet/deposit/callback',
    loadComponent: () => import('./features/wallet/pages/deposit-callback/deposit-callback.component').then(m => m.DepositCallbackComponent)
  },
  {
    path: 'bets',
    loadComponent: () => import('./features/bets/bets.component').then(m => m.BetsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'match-pools',
    loadComponent: () => import('./features/match-pools/match-pools.component').then(m => m.MatchPoolsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/legal/terms.component').then(m => m.TermsComponent)
  },
  {
    path: 'privacy',
    loadComponent: () => import('./features/legal/privacy.component').then(m => m.PrivacyComponent)
  },
  {
    path: 'cookies',
    loadComponent: () => import('./features/legal/cookies.component').then(m => m.CookiesComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];