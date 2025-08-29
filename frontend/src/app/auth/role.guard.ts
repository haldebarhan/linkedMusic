import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';

export const RoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed: Array<'ADMIN' | 'USER' | 'PROVIDER'> =
    route.data?.['roles'] || [];

  return auth.auth$.pipe(
    map((state) => {
      const role = state.user?.role;
      if (
        state.isAuthenticated &&
        role &&
        (allowed.length === 0 || allowed.includes(role))
      ) {
        return true;
      }
      // Redirige si pas le bon rôle ou pas connecté
      router.navigate(['/']);
      return false;
    })
  );
};
