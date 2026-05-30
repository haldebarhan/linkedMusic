import { Injectable } from '@angular/core';
import { ApiAuthService } from './api-auth.service';
import { AuthService } from './auth.service';
import { tap } from 'rxjs/operators';
import { interval, Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RefreshTokenService {
  private isRefreshing = false;

  private refreshSubscription?: Subscription;
  private readonly REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes

  constructor(
    private apiAuth: ApiAuthService,
    private authService: AuthService,
  ) {}

  /** Refresh automatique proactif */
  startAutoRefresh(): void {
    this.stopAutoRefresh();

    this.refreshSubscription = interval(this.REFRESH_INTERVAL).subscribe(() => {
      this.apiAuth.refreshToken().subscribe({
        error: () => {
          // Si refresh échoue, on ne fait rien ici
          // L'interceptor gérera la déconnexion sur 401
        },
      });
    });
  }

  stopAutoRefresh(): void {
    this.refreshSubscription?.unsubscribe();
  }

  refreshToken() {
    if (this.isRefreshing) {
      // Attendre que le refresh en cours se termine (à améliorer avec BehaviorSubject si besoin)
      return this.apiAuth.refreshToken();
    }

    this.isRefreshing = true;

    return this.apiAuth.refreshToken().pipe(
      tap({
        next: () => {
          this.isRefreshing = false;
          // Optionnel : recharger l'utilisateur
          // this.authService.loadCurrentUser(...);
        },
        error: () => {
          this.isRefreshing = false;
        },
      }),
    );
  }
}
