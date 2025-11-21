import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { RefreshTokenService } from './refresh-token.service';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private refreshSvc: RefreshTokenService,
    private authSvc: AuthService
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Endpoints où on N'ENVOIE PAS le token (car l'utilisateur n'en a pas encore)
    const noTokenEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/activate',
      '/auth/social',
    ];

    // Vérifier si c'est un endpoint sans token
    const isNoTokenEndpoint = noTokenEndpoints.some((endpoint) =>
      req.url.includes(endpoint)
    );

    // Vérifier si c'est une requête de refresh
    const isRefreshEndpoint = req.url.includes('/auth/refresh');

    // Récupérer le token actuel
    const accessToken = this.authSvc.token;

    // Ajouter le token à TOUTES les requêtes sauf celles dans noTokenEndpoints
    // ⚠️ IMPORTANT : On ENVOIE le token pour /auth/refresh (le backend en a besoin)
    const authReq =
      accessToken && !isNoTokenEndpoint
        ? req.clone({
            setHeaders: { Authorization: `Bearer ${accessToken}` },
          })
        : req;

    // Envoyer la requête et gérer les erreurs 401
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si erreur 401 et que ce n'est PAS déjà une requête de refresh
        // (pour éviter la boucle infinie)
        if (error.status === 401 && !isRefreshEndpoint) {
          // Tenter de refresh le token
          return this.refreshSvc.refreshToken().pipe(
            switchMap((newToken) => {
              // Retry la requête avec le nouveau token
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });

              return next.handle(retryReq);
            }),
            catchError((refreshError) => {
              // Si le refresh échoue aussi, propager l'erreur
              return throwError(() => error);
            })
          );
        }

        // Pour toutes les autres erreurs, les propager
        return throwError(() => error);
      })
    );
  }
}
