import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, Subject, of, timer } from 'rxjs';
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
  private tokenRefreshed$ = new Subject<string>();
  private scheduleHandle: any;

  constructor(private auth: AuthService, private api: ApiAuthService) {}

  /** Démarre la planification proactive au boot */
  startAutoRefresh() {
    // replanifie à chaque changement de token (login/refresh/logout)
    this.auth.auth$.subscribe((state) => {
      this.clearSchedule();
      if (state.accessToken) this.scheduleProactive(state.accessToken);
    });
  }

  /** Rafraîchit si nécessaire AVANT une requête (optionnel) */
  refreshIfExpiringSoon(thresholdSec = 60): Observable<string | null> {
    const t = this.auth.token;
    if (!t) return of(null);
    const exp = this.getExp(t);
    if (!exp) return of(null);

    const nowSec = Math.floor(Date.now() / 1000);
    if (exp - nowSec <= thresholdSec) {
      return this.refreshToken();
    }
    return of(null);
  }

  /** Appelé par l’interceptor quand 401, avec anti-concurrence + retry */
  refreshToken(): Observable<string> {
    if (this.inFlight) {
      return this.tokenRefreshed$.pipe(first());
    }
    this.inFlight = true;

    return this.api.refreshToken().pipe(
      // map pour extraire le token de la réponse
      switchMap((res) => {
        // Backend renvoie un nouveau JWT dans res.token
        this.auth.updateToken(res.token);
        this.tokenRefreshed$.next(res.token);
        return of(res.token);
      }),
      finalize(() => {
        this.inFlight = false;
      }),
      catchError((err) => {
        this.tokenRefreshed$.error?.(err);
        // Nettoie l’état si refresh impossible
        this.auth.logout();
        throw err;
      })
    );
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
