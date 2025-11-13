import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, catchError, from, switchMap } from 'rxjs';
import { fbAuth } from '../core/firebase';
import { RefreshTokenService } from './refresh-token.service';

const STORAGE_KEY = 'app_auth_state_v1';
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private refreshSvc: RefreshTokenService) {}
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const isRefresh = req.url.endsWith('/auth/refresh');

    // 1) Pré-refresh si le token expire bientôt (optionnel mais recommandé)
    return this.refreshSvc.refreshIfExpiringSoon(60).pipe(
      switchMap(() => {
        const accessToken = this.refreshSvc.getAuth().token; // ou via un getter
        const withAuth =
          accessToken && !isRefresh
            ? req.clone({
                setHeaders: { Authorization: `Bearer ${accessToken}` },
              })
            : req;

        return next.handle(withAuth).pipe(
          // 2) Si 401, tenter un refresh (sauf sur /auth/refresh pour éviter la boucle)
          catchError((err) => {
            if (err.status === 401 && !isRefresh) {
              return this.refreshSvc.refreshToken().pipe(
                switchMap((newToken) => {
                  const retryReq = req.clone({
                    setHeaders: { Authorization: `Bearer ${newToken}` },
                  });
                  return next.handle(retryReq);
                })
              );
            }
            throw err;
          })
        );
      })
    );
  }
}
