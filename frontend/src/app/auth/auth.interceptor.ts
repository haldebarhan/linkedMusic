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
    private authSvc: AuthService,
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const isAuthEndpoint = req.url.includes('/auth/');
    const isRefreshRequest = req.url.includes('/auth/refresh');
    let authReq = req;

    if (!req.withCredentials) {
      authReq = req.clone({ withCredentials: true });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si on reçoit 401 et que ce n'est pas déjà une tentative de refresh
        if (error.status === 401 && !isRefreshRequest) {
          return this.handle401Error(authReq, next);
        }

        return throwError(() => error);
      }),
    );
  }

  private handle401Error(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return this.refreshSvc.refreshToken().pipe(
      switchMap(() => {
        // On réessaie la requête originale après refresh
        return next.handle(req.clone({ withCredentials: true }));
      }),
      catchError((refreshError) => {
        // Si le refresh échoue → déconnexion
        this.authSvc.logout();
        return throwError(() => refreshError);
      }),
    );
  }
}
