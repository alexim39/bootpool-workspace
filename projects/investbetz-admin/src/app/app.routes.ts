import { Routes } from '@angular/router';
import { adminAuthGuard } from './auth/admin-auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./auth/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent),
    canActivate: [adminAuthGuard],
    canActivateChild: [adminAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'pods',
        loadComponent: () => import('./admin/pods/pods.component').then(m => m.PodsComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./admin/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./admin/users/user-detail.component').then(m => m.UserDetailComponent)
      },
      {
        path: 'stakes',
        loadComponent: () => import('./admin/stakes/stakes.component').then(m => m.StakesComponent)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./admin/transactions/transactions.component').then(m => m.TransactionsComponent)
      },
      {
        path: 'withdrawals',
        loadComponent: () => import('./admin/withdrawals/withdrawals.component').then(m => m.WithdrawalsComponent)
      },
      {
        path: 'kyc',
        loadComponent: () => import('./admin/kyc/kyc.component').then(m => m.KycComponent)
      },
      {
        path: 'bi-reports',
        loadComponent: () => import('./admin/bi-reports/bi-reports.component').then(m => m.BIReportsComponent)
      },
      {
        path: 'campaigns',
        loadComponent: () => import('./admin/campaigns/campaigns.component').then(m => m.CampaignsComponent)
      },
      {
        path: 'financials',
        loadComponent: () => import('./admin/financials/financials.component').then(m => m.FinancialsComponent)
      },
      {
        path: 'deposit-mgt',
        loadComponent: () => import('./admin/deposit-mgt/deposit-mgt.component').then(m => m.DepositMgtComponent)
      },
      {
        path: 'withdraw-mgt',
        loadComponent: () => import('./admin/withdraw-mgt/withdraw-mgt.component').then(m => m.WithdrawMgtComponent)
      },
      {
        path: 'loan-mgt',
        loadComponent: () => import('./admin/loan-mgt/loan-mgt.component').then(m => m.LoanMgtComponent)
      },
      {
        path: 'betting',
        loadComponent: () => import('./admin/betting/betting.component').then(m => m.BettingComponent)
      },
      {
        path: 'match-pools',
        loadComponent: () => import('./admin/match-pools/match-pools.component').then(m => m.AdminMatchPoolsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./admin/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'featured-games',
        loadComponent: () => import('./admin/featured-games/featured-games.component').then(m => m.FeaturedGamesComponent)
      },
      {
        path: 'ora-chat',
        loadComponent: () => import('./admin/ora-chat/ora-chat.component').then(m => m.OraChatComponent)
      }
    ]
  }
];
