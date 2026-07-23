import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AdminAuthService } from './';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

export const adminAuthGuard = () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  // Kick off a verify attempt if not yet checked (safe to call repeatedly — idempotent)
  if (!auth.checked()) {
    auth.verifyApi().subscribe();
  }

  return new Promise<boolean>(resolve => {
    const safetyTimer = setTimeout(() => {
      router.navigate(['/admin/login']);
      resolve(false);
    }, 12000);

    const check = () => {
      if (auth.checked()) {
        if (auth.authenticated()) {
          clearTimeout(safetyTimer);
          resolve(true);
          return;
        }
        // Checked but not authed — final retry
        firstValueFrom(
          auth.verifyApi().pipe(
            timeout(8000),
            catchError(() => of(false))
          )
        ).then(ok => {
          if (ok) {
            clearTimeout(safetyTimer);
            resolve(true);
          } else {
            router.navigate(['/admin/login']);
            resolve(false);
          }
        });
        return;
      }
      setTimeout(check, 150);
    };
    check();
  });
};
