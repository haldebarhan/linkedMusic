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
 * Guard pour les routes protégées
 * Tente un refresh du token s'il est expiré avant de rediriger vers login
 */
export const authCanActivate: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const refreshSvc = inject(RefreshTokenService);

  // Si pas de token du tout, rediriger immédiatement vers login
  const token = auth.token;
  if (!token) {
    console.log('[AuthGuard] No token found, redirecting to login');
    return router.createUrlTree(['/login'], {
      queryParams: { redirect: state.url },
    });
  }

  // Si le token est expiré, tenter un refresh AVANT de rediriger
  if (refreshSvc.isTokenExpired(token)) {
    console.log(
      '[AuthGuard] Token expired, attempting refresh before redirect...'
    );

    return from(refreshSvc.refreshToken()).pipe(
      map(() => {
        console.log(
          '[AuthGuard] Token refreshed successfully, allowing access'
        );
        return true; // Autoriser l'accès
      }),
      catchError((err) => {
        console.error('[AuthGuard] Refresh failed, redirecting to login:', err);
        // Si le refresh échoue, alors rediriger vers login
        return of(
          router.createUrlTree(['/login'], {
            queryParams: { redirect: state.url },
          })
        );
      })
    );
  }

  // Token valide et non expiré, vérifier l'authentification
  if (!auth.snapshot.isAuthenticated) {
    console.log('[AuthGuard] User not authenticated, redirecting to login');
    return router.createUrlTree(['/login'], {
      queryParams: { redirect: state.url },
    });
  }

  console.log('[AuthGuard] Token valid, allowing access');
  return true;
};

/**
 * Guard CanMatch pour le lazy loading
 * Même logique que authCanActivate
 */
export const authCanMatch: CanMatchFn = (_route, segments) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const refreshSvc = inject(RefreshTokenService);

  // Construire l'URL de redirection
  let redirectUrl = '/';
  if (Array.isArray(segments)) {
    redirectUrl =
      '/' +
      segments
        .map((s: UrlSegment) => s.path)
        .filter(Boolean)
        .join('/');
  } else if (
    (segments as any)?.segments &&
    Array.isArray((segments as any).segments)
  ) {
    const segs = (segments as any).segments as UrlSegment[];
    redirectUrl =
      '/' +
      segs
        .map((s) => s.path)
        .filter(Boolean)
        .join('/');
  } else {
    const nav = router.getCurrentNavigation();
    redirectUrl =
      nav?.finalUrl?.toString() ?? nav?.initialUrl?.toString() ?? '/';
  }

  // Si pas de token du tout, rediriger immédiatement vers login
  const token = auth.token;
  if (!token) {
    console.log('[AuthGuard] No token found, redirecting to login');
    return router.createUrlTree(['/login'], {
      queryParams: { redirect: redirectUrl },
    });
  }

  // Si le token est expiré, tenter un refresh AVANT de rediriger
  if (refreshSvc.isTokenExpired(token)) {
    console.log(
      '[AuthGuard] Token expired, attempting refresh before redirect...'
    );

    return from(refreshSvc.refreshToken()).pipe(
      map(() => {
        console.log(
          '[AuthGuard] Token refreshed successfully, allowing access'
        );
        return true;
      }),
      catchError((err) => {
        console.error('[AuthGuard] Refresh failed, redirecting to login:', err);
        return of(
          router.createUrlTree(['/login'], {
            queryParams: { redirect: redirectUrl },
          })
        );
      })
    );
  }

  // Token valide et non expiré, vérifier l'authentification
  if (!auth.snapshot.isAuthenticated) {
    console.log('[AuthGuard] User not authenticated, redirecting to login');
    return router.createUrlTree(['/login'], {
      queryParams: { redirect: redirectUrl },
    });
  }

  console.log('[AuthGuard] Token valid, allowing access');
  return true;
};

/**
 * Logique pour les routes guest (login, register, etc.)
 */
const decideForRoute = (
  data: { [k: string]: any } | undefined,
  state?: { url: string }
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
        const redirect = state?.url || redirectTo;
        if (redirect === '/login' || redirect === '/register') {
          console.log(
            '[GuestGuard] User authenticated, redirecting to',
            redirectTo
          );
          return router.createUrlTree([redirectTo]);
        }
        console.log(
          '[GuestGuard] User authenticated, redirecting to',
          redirect
        );
        return router.createUrlTree([redirect]);
      }
      return true;

    case 'logoutThenAllow':
      if (isAuth) {
        console.log('[GuestGuard] Logging out user before allowing access');
        auth.logout();
      }
      return true;

    default:
      return true;
  }
};

/**
 * Guard pour les routes guest (login, register)
 * Redirige les utilisateurs connectés vers l'accueil
 */
export const guestCanMatch: CanMatchFn = (
  route: Route,
  _segments: UrlSegment[]
) => decideForRoute(route.data);

export const guestCanActivate: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => decideForRoute(route.data);
