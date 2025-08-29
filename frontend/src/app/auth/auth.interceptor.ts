// auth.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { catchError, switchMap, throwError } from 'rxjs';

// Endpoints d'auth à ignorer pour le refresh
const AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/activate',
  '/auth/refresh',
];

// Utilitaire: savoir si l'URL cible est un endpoint d'auth
function isAuthEndpoint(url: string): boolean {
  try {
    // robustesse: supporte absolu/relatif
    const u = new URL(url, window.location.origin);
    const p = u.pathname;
    return AUTH_PATHS.some((x) => p.endsWith(x));
  } catch {
    // au cas où (SSR / URL exotique)
    return AUTH_PATHS.some((x) => url.includes(x));
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const refresher = inject(RefreshTokenService);

  // 1) Attache Bearer si présent
  const token = auth.token;
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  // 2) NE PAS lancer de refresh proactif ici
  //    (tu le fais déjà dans APP_INITIALIZER → refresher.startAutoRefresh())

  // 3) Gestion du 401: refresh seulement pour les endpoints "non-auth"
  const isAuthCall = isAuthEndpoint(authReq.url);

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const is401 = err.status === 401;

      // - Si ce n'est pas un 401 → laisse passer
      // - Si c'est un 401 MAIS la requête visait un endpoint d'auth → ne refresh pas
      if (!is401 || isAuthCall) {
        return throwError(() => err);
      }

      // 401 sur un endpoint "app" → tente un refresh puis rejoue la requête
      return refresher.refreshToken().pipe(
        switchMap((newToken) => {
          // Sécurité: si ton service met à jour le token en interne,
          // on le relit depuis AuthService; sinon on se sert de newToken
          const t = (typeof newToken === 'string' && newToken) || auth.token;
          const retried = req.clone({
            setHeaders: t ? { Authorization: `Bearer ${t}` } : {},
          });
          return next(retried);
        }),
        catchError((refreshErr) => {
          // Échec de refresh → laisse l'erreur remonter (le service se chargera de logout si besoin)
          return throwError(() => refreshErr);
        })
      );
    })
  );
};
