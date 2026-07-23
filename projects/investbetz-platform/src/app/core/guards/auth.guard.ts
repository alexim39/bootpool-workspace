import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../core/services';
import { map, take, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return auth.getProfile().pipe(
    take(1),
    map(res => {
      if (res.success && res.data) {
        // Handle both response formats: { user, token } or just user
        const userData = res.data as any;
        const token = userData.token || auth.token()!;
        const user = userData.user || userData;
        auth.setAuth(token, user);
        return true;
      }
      router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }),
    catchError(() => {
      router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return of(false);
    })
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return true;
  
  router.navigate(['/home']);
  return false;
};