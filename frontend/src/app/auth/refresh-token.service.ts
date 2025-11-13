import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, ReplaySubject, Subject, of, timer } from 'rxjs';
import {
  catchError,
  filter,
  first,
  finalize,
  switchMap,
  tap,
} from 'rxjs/operators';
import { ApiAuthService } from './api-auth.service';

@Injectable({ providedIn: 'root' })
export class RefreshTokenService {
  private inFlight = false;
  private tokenRefreshed$ = new ReplaySubject<string>(1);
  private scheduleHandle: any;

  constructor(private auth: AuthService, private api: ApiAuthService) {}

  refreshToken(): Observable<string> {
    if (this.inFlight) return this.tokenRefreshed$.pipe(first());

    this.inFlight = true;
    return this.api.refreshToken().pipe(
      switchMap((res) => {
        this.auth.updateToken(res.token);
        this.tokenRefreshed$.next(res.token);
        return of(res.token);
      }),
      finalize(() => {
        this.inFlight = false;
      }),
      catchError((err) => {
        // reset le subject pour prochains listeners
        this.tokenRefreshed$.error?.(err);
        this.tokenRefreshed$ = new ReplaySubject<string>(1);
        this.auth.logout();
        throw err;
      })
    );
  }

  refreshIfExpiringSoon(thresholdSec = 60): Observable<string | null> {
    const t = this.auth.token;
    if (!t) return of(null);
    const exp = this.getExp(t);
    if (!exp) return of(null);
    const now = Math.floor(Date.now() / 1000);
    return exp - now <= thresholdSec ? this.refreshToken() : of(null);
  }

  /** Démarre la planification proactive au boot */
  startAutoRefresh() {
    // replanifie à chaque changement de token (login/refresh/logout)
    this.auth.auth$.subscribe((state) => {
      this.clearSchedule();
      if (state.accessToken) this.scheduleProactive(state.accessToken);
    });
  }

  getAuth() {
    return this.auth;
  }

  // ---------- Planification proactive ----------

  private scheduleProactive(token: string, thresholdSec = 60) {
    const exp = this.getExp(token);
    if (!exp) return;
    const nowMs = Date.now();
    const refreshAtMs = (exp - thresholdSec) * 1000; // 60s avant exp
    const delay = Math.max(0, refreshAtMs - nowMs);

    this.scheduleHandle = timer(delay)
      .pipe(
        switchMap(() => this.refreshToken()),
        catchError(() => of(null)) // en cas d’échec, on laisse l’interceptor gérer via 401
      )
      .subscribe();
  }

  private clearSchedule() {
    if (this.scheduleHandle?.unsubscribe) this.scheduleHandle.unsubscribe();
    this.scheduleHandle = null;
  }

  // ---------- Utilitaires ----------

  private getExp(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return typeof payload?.exp === 'number' ? payload.exp : null;
    } catch {
      return null;
    }
  }
}
