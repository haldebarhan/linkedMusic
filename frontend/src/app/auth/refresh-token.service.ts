import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, Subject, of, throwError, timer } from 'rxjs';
import { catchError, switchMap, tap, shareReplay } from 'rxjs/operators';
import { ApiAuthService } from './api-auth.service';

@Injectable({ providedIn: 'root' })
export class RefreshTokenService {
  private refreshInProgress$: Observable<string> | null = null;
  private scheduleHandle: any;

  constructor(private auth: AuthService, private api: ApiAuthService) {}

  /**
   * Refresh le token de manière sécurisée
   * Si un refresh est déjà en cours, retourne l'observable existant
   */
  refreshToken(): Observable<string> {
    // Si un refresh est déjà en cours, on partage le même observable
    if (this.refreshInProgress$) {
      return this.refreshInProgress$;
    }

    console.log('[RefreshToken] Starting token refresh...');

    this.refreshInProgress$ = this.api.refreshToken().pipe(
      tap((res) => {
        console.log('[RefreshToken] Token refreshed successfully');
        // Met à jour le token dans auth.service
        // Cela va trigger le BehaviorSubject auth$ qui notifiera le socket
        this.auth.setAccessToken(res.token);
      }),
      switchMap((res) => of(res.token)),
      catchError((err) => {
        console.error('[RefreshToken] Refresh failed:', err);
        // En cas d'erreur, déconnecter l'utilisateur
        this.auth.logout();
        return throwError(() => err);
      }),
      // Important: partager le résultat entre tous les abonnés
      shareReplay(1),
      // Nettoyer après un court délai
      tap({
        finalize: () => {
          setTimeout(() => {
            this.refreshInProgress$ = null;
          }, 1000);
        },
      })
    );

    return this.refreshInProgress$;
  }

  /**
   * Vérifie si le token expire bientôt et le refresh si nécessaire
   */
  refreshIfExpiringSoon(thresholdSec = 60): Observable<string | null> {
    const token = this.auth.token;
    if (!token) {
      return of(null);
    }

    const exp = this.getTokenExpiration(token);
    if (!exp) {
      return of(null);
    }

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = exp - now;

    // Si le token expire dans moins de thresholdSec, le refresh
    if (timeUntilExpiry <= thresholdSec) {
      console.log(
        `[RefreshToken] Token expires in ${timeUntilExpiry}s, refreshing...`
      );
      return this.refreshToken();
    }

    return of(null);
  }

  /**
   * Démarre le refresh automatique proactif
   * À appeler au démarrage de l'application
   */
  startAutoRefresh(): void {
    console.log('[RefreshToken] Starting auto-refresh scheduler');

    // S'abonner aux changements d'état d'authentification
    this.auth.auth$.subscribe((state) => {
      this.clearSchedule();

      if (state.accessToken && state.isAuthenticated) {
        this.scheduleProactiveRefresh(state.accessToken);
      }
    });
  }

  /**
   * Planifie un refresh proactif avant l'expiration du token
   */
  private scheduleProactiveRefresh(token: string, thresholdSec = 60): void {
    const exp = this.getTokenExpiration(token);
    if (!exp) {
      console.warn(
        '[RefreshToken] Cannot schedule refresh: invalid token expiration'
      );
      return;
    }

    const nowMs = Date.now();
    const expMs = exp * 1000;
    const refreshAtMs = expMs - thresholdSec * 1000; // Refresh 60s avant expiration
    const delay = Math.max(0, refreshAtMs - nowMs);

    console.log(
      `[RefreshToken] Scheduling proactive refresh in ${Math.floor(
        delay / 1000
      )}s`
    );

    this.scheduleHandle = timer(delay)
      .pipe(
        switchMap(() => {
          console.log('[RefreshToken] Proactive refresh triggered');
          return this.refreshToken();
        }),
        catchError((err) => {
          console.error('[RefreshToken] Proactive refresh failed:', err);
          // En cas d'échec, l'interceptor gérera le 401
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Annule le refresh planifié
   */
  private clearSchedule(): void {
    if (this.scheduleHandle) {
      this.scheduleHandle.unsubscribe();
      this.scheduleHandle = null;
      console.log('[RefreshToken] Cleared scheduled refresh');
    }
  }

  /**
   * Extrait la date d'expiration du token JWT
   */
  private getTokenExpiration(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return typeof payload?.exp === 'number' ? payload.exp : null;
    } catch (err) {
      console.error('[RefreshToken] Failed to parse token:', err);
      return null;
    }
  }

  /**
   * Vérifie si le token est expiré
   */
  isTokenExpired(token: string): boolean {
    const exp = this.getTokenExpiration(token);
    if (!exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return now >= exp;
  }
}
