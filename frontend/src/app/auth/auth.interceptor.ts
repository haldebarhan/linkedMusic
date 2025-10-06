import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { fbAuth } from '../core/firebase';

const STORAGE_KEY = 'app_auth_state_v1';
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const raw = localStorage.getItem(STORAGE_KEY);
    const accessToken: string | null = raw
      ? JSON.parse(raw)?.accessToken ?? null
      : null;
    if (accessToken) {
      const cloned = req.clone({
        setHeaders: { Authorization: `Bearer ${accessToken}` },
      });
      return next.handle(cloned);
    }

    const user = fbAuth.currentUser;
    if (!user) return next.handle(req);

    return from(user.getIdToken()).pipe(
      switchMap((idToken) => {
        const cloned = req.clone({
          setHeaders: { Authorization: `Bearer ${idToken}` },
        });
        return next.handle(cloned);
      })
    );
  }
}
