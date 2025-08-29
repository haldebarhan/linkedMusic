import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs/operators';

export const AuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.auth$.pipe(
    map((state) => {
      if (state.isAuthenticated) return true;
      router.navigate(['/login']);
      return false;
    })
  );
};

// src/app/auth/guest.guard.ts
export const GuestGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowList = ['/verify', '/auth/activate-account'];
  if (allowList.some((p) => state.url.startsWith(p))) {
    return true;
  }
  return auth.auth$.pipe(
    take(1),
    map((s) => (s.isAuthenticated ? router.createUrlTree(['/']) : true))
  );
};
