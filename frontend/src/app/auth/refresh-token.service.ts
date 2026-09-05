import { Injectable } from '@angular/core';
import { ApiService } from '../shared/services/api.service';
import { AuthService } from './auth.service';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { Observable, Subscription, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RefreshTokenService {
  private refreshInFlight$?: Observable<string>;

  private refreshSubscription?: Subscription;
  private refreshTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private api: ApiService,
    private authService: AuthService,
  ) {}

  /** Refresh shortly before JWT expiration, including immediately after login. */
  startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshSubscription = this.authService.auth$.subscribe((state) => {
      this.scheduleRefresh(state.accessToken);
    });
  }

  stopAutoRefresh(): void {
    this.refreshSubscription?.unsubscribe();
    this.refreshSubscription = undefined;
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = undefined;
  }

  private scheduleRefresh(accessToken: string | null): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    if (!accessToken) return;

    const expiresAt = this.getExpiry(accessToken);
    const delay = expiresAt
      ? Math.max(expiresAt - Date.now() - 60_000, 5_000)
      : 50 * 60_000;
    this.refreshTimer = setTimeout(() => {
      this.refreshToken().subscribe({ error: () => undefined });
    }, delay);
  }

  private getExpiry(token: string): number | null {
    try {
      const encodedPayload = token.split('.')[1];
      if (!encodedPayload) return null;
      const payload = JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  refreshToken(): Observable<string> {
    if (this.refreshInFlight$) return this.refreshInFlight$;

    this.refreshInFlight$ = this.api.refreshToken().pipe(
      map((response) => response.data?.accessToken),
      tap((accessToken) => {
        if (!accessToken) throw new Error('Refresh token response did not include an access token.');
        this.authService.setAccessToken(accessToken);
      }),
      catchError((error) => {
        this.authService.clearAuthState();
        return throwError(() => error);
      }),
      finalize(() => (this.refreshInFlight$ = undefined)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.refreshInFlight$;
  }
}
