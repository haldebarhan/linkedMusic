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
import { fbAuth } from '../core/firebase';

type GuestPolicy = 'allow' | 'redirectIfAuth' | 'logoutThenAllow';

export const authCanActivate: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.snapshot.isAuthenticated
    ? true
    : router.createUrlTree(['/login'], {
        queryParams: { redirect: state.url },
      });
};

export const authCanMatch: CanMatchFn = (_route, segments) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const url = '/' + segments.map((s) => s.path).join('/');
  return auth.snapshot.isAuthenticated
    ? true
    : router.createUrlTree(['/login'], { queryParams: { redirect: url } });
};

const decideForRoute = (
  data: { [k: string]: any } | undefined
): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isAuth = auth.snapshot.isAuthenticated || !!fbAuth.currentUser;
  const policy: GuestPolicy = (data?.['guestPolicy'] ?? 'allow') as GuestPolicy;
  const redirectTo: string = data?.['redirectTo'] ?? '/';

  switch (policy) {
    case 'allow':
      return true;

    case 'redirectIfAuth':
      return isAuth ? router.createUrlTree([redirectTo]) : true;

    case 'logoutThenAllow':
      if (isAuth) auth.logout();
      return true;

    default:
      return true;
  }
};

export const guestCanMatch: CanMatchFn = (
  route: Route,
  _segments: UrlSegment[]
) => decideForRoute(route.data);
export const guestCanActivate: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => decideForRoute(route.data);
