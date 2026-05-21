import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  CanMatchFn,
  Route,
  Router,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { from, of, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

type GuestPolicy = 'allow' | 'redirectIfAuth' | 'logoutThenAllow';

/**
 * Guard pour les routes protégées (auth requise)
 */
export const authCanActivate: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const refreshSvc = inject(RefreshTokenService);

  // Si l'utilisateur est déjà considéré connecté en mémoire → on autorise
  if (auth.snapshot.isAuthenticated) {
    return true;
  }

  // Sinon, on tente de récupérer l'utilisateur (cela va déclencher le refresh via l'interceptor si nécessaire)
  return from(auth.getMe()).pipe(
    map(() => true),
    catchError((err) => {
      console.warn('[AuthGuard] Accès refusé, redirection vers login');
      return of(
        router.createUrlTree(['/login'], {
          queryParams: { redirect: state.url },
        }),
      );
    }),
  );
};

/**
 * Version CanMatch (pour lazy loading)
 */
export const authCanMatch: CanMatchFn = (route, segments) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.snapshot.isAuthenticated) {
    return true;
  }

  // Construire l'URL actuelle pour la redirection
  const redirectUrl = segments.length
    ? '/' + segments.map((s) => s.path).join('/')
    : '/';

  return from(auth.getMe()).pipe(
    map(() => true),
    catchError(() => {
      return of(
        router.createUrlTree(['/login'], {
          queryParams: { redirect: redirectUrl },
        }),
      );
    }),
  );
};

/**
 * Guard pour les routes "guest" (login, register, etc.)
 */
const decideForRoute = (
  data: { [k: string]: any } | undefined,
  state?: { url: string },
): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isAuth = auth.snapshot.isAuthenticated;
  const policy: GuestPolicy = (data?.['guestPolicy'] ?? 'allow') as GuestPolicy;
  const redirectTo: string = data?.['redirectTo'] ?? '/';

  switch (policy) {
    case 'allow':
      return true;

    case 'redirectIfAuth':
      if (isAuth) {
        return router.createUrlTree([redirectTo]);
      }
      return true;

    case 'logoutThenAllow':
      if (isAuth) {
        auth.logout();
      }
      return true;

    default:
      return true;
  }
};

export const guestCanActivate: CanActivateFn = (route) =>
  decideForRoute(route.data);

export const guestCanMatch: CanMatchFn = (route) => decideForRoute(route.data);
