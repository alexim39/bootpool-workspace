import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);

  if (req.url.includes('/auth/refresh')) {
    return next(req);
  }

  const token = auth.token();
  if (token) {
    req = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        return handle401(req, next, auth);
      }
      return throwError(() => error);
    })
  );
};

function handle401(req: HttpRequest<unknown>, next: HttpHandlerFn, auth: AuthService): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshSubject.next(null);

    return auth.refreshToken().pipe(
      switchMap((res) => {
        isRefreshing = false;
        if (res?.token) {
          auth.setAuth(res.token, auth.user()!);
          refreshSubject.next(res.token);
          return next(req.clone({
            headers: req.headers.set('Authorization', `Bearer ${res.token}`)
          }));
        }
        auth.logout();
        refreshSubject.next(null);
        return throwError(() => new Error('Session expired'));
      }),
      catchError((err) => {
        isRefreshing = false;
        auth.logout();
        refreshSubject.next(null);
        return throwError(() => err);
      })
    );
  }

  return refreshSubject.pipe(
    filter((t): t is string => t !== null),
    take(1),
    switchMap((newToken) =>
      next(req.clone({
        headers: req.headers.set('Authorization', `Bearer ${newToken}`)
      }))
    )
  );
}
