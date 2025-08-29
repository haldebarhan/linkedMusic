import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { AuthState, AuthUser } from '../shared/interfaces/auth';

const STORAGE_KEY = 'app_auth_state_v1';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _auth$ = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
  });

  /** Flux public à utiliser avec l'async pipe */
  readonly auth$ = this._auth$.asObservable();

  readonly user$ = this.auth$.pipe(map((s) => s.user));
  readonly isLoggedIn$ = this.auth$.pipe(map((s) => s.isAuthenticated));

  /** Snapshot courant (utile ponctuellement) */
  get snapshot(): AuthState {
    return this._auth$.value;
  }

  /** Token courant (pour l'interceptor) */
  get token(): string | null {
    return this._auth$.value.accessToken;
  }

  /** Initialisation au démarrage (restauration storage) */
  init(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const restored = JSON.parse(raw) as AuthState;
      // sécurité minimale: token + user -> connecté
      if (restored?.accessToken && restored?.user) {
        this._auth$.next({
          isAuthenticated: true,
          user: restored.user,
          accessToken: restored.accessToken,
        });
      }
    } catch {}
  }

  /** Connexion réussie (depuis ton API) */
  setLogin(accessToken: string, user: AuthUser): void {
    const next: AuthState = { isAuthenticated: true, accessToken, user };
    this._auth$.next(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  /** Mise à jour du profil en mémoire (ex: après édition) */
  patchUser(patch: Partial<AuthUser>): void {
    const { user, ...rest } = this.snapshot;
    const nextUser = { ...(user || {}), ...patch } as AuthUser;
    const next: AuthState = {
      ...rest,
      user: nextUser,
      isAuthenticated: !!rest.accessToken,
    };
    this._auth$.next(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  /** Remplace uniquement le token (après refresh) */
  updateToken(accessToken: string) {
    const cur = this._auth$.value;
    const next: AuthState = {
      ...cur,
      accessToken,
      isAuthenticated: !!accessToken && !!cur.user,
    };
    this._auth$.next(next);
    localStorage.setItem('app_auth_state_v1', JSON.stringify(next));
  }

  /** Déconnexion */
  logout(): void {
    this._auth$.next({ isAuthenticated: false, user: null, accessToken: null });
    localStorage.removeItem(STORAGE_KEY);
  }
}
