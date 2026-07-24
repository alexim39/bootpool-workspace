import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AdminAuthService } from './';
import { firstValueFrom, timeout, catchError, of, race, timer } from 'rxjs';

export const adminAuthGuard = () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  if (auth.checked()) {
    if (auth.authenticated()) return true;
    return firstValueFrom(
      auth.verifyApi().pipe(
        timeout(8000),
        catchError(() => of(false))
      )
    ).then(ok => {
      if (!ok) router.navigate(['/admin/login']);
      return ok;
    });
  }

  const verify$ = auth.verifyApi().pipe(
    timeout(12000),
    catchError(() => of(false))
  );

  return firstValueFrom(verify$).then(ok => {
    if (!ok) router.navigate(['/admin/login']);
    return ok;
  });
};