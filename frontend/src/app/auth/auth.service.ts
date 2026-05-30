import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, map } from 'rxjs';
import { AuthState, AuthUser } from '../shared/interfaces/auth';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { fbAuth } from '../core/firebase';
import { ApiAuthService } from './api-auth.service';
import { UserUpdateService } from './user-update.service';
import { JsonPipe } from '@angular/common';

const STORAGE_KEY = 'app_auth_state_v1';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _auth$ = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    source: null,
  });

  constructor(
    private api: ApiAuthService,
    private userUpdateService: UserUpdateService,
  ) {
    this.init();
    // Gérer le flow redirect (iOS/Safari)
    getRedirectResult(fbAuth).catch(() => {});

    // Écouter les mises à jour utilisateur (profil, etc.)
    this.userUpdateService.userUpdates$.subscribe((userData) => {
      this.patchUser(userData);
    });
  }

  /** Flux public à utiliser avec l'async pipe */
  auth$ = this._auth$.asObservable();
  readonly user$ = this.auth$.pipe(map((s) => s.user));
  readonly isLoggedIn$ = this.auth$.pipe(map((s) => s.isAuthenticated));

  get token(): string | null {
    return null;
  }

  get snapshot() {
    return this._auth$.value;
  }

  init(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const savedState = JSON.parse(raw) as AuthState;
        savedState.accessToken = null;
        this._auth$.next(savedState);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  // ====================== LOGIN ======================

  async loginWithPassword(email: string, password: string): Promise<void> {
    await firstValueFrom(this.api.loginWithPassword({ email, password }));
    await this.loadCurrentUser('password');
  }

  async activateAccount(email: string, token: string): Promise<void> {
    await firstValueFrom(this.api.activateAccount({ email, token }));
    await this.loadCurrentUser('password');
  }

  // ====================== GOOGLE ======================

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(fbAuth, provider);
    await this.handleGoogleAuthSuccess('google');
  }

  async registerWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(fbAuth, provider);
    await this.handleGoogleAuthSuccess('google');
  }

  async loginWithGoogleRedirect(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(fbAuth, provider);
  }

  // ====================== USER DATA ======================

  async getMe() {
    return await firstValueFrom(this.api.getMe());
  }

  /** Déconnexion */
  async logout(): Promise<void> {
    try {
      await fbAuth.signOut();
      await firstValueFrom(this.api.logout()); // Appel backend pour clear cookie
    } catch {}

    this.clearAuthState();
  }

  // ====================== UTILS ======================

  /** Mise à jour du profil en mémoire (ex: après édition) */
  patchUser(patch: Partial<AuthUser>): void {
    const { user, ...rest } = this.snapshot;
    const nextUser = { ...(user || {}), ...patch } as AuthUser;
    const next: AuthState = {
      ...rest,
      user: nextUser,
      isAuthenticated: !!rest.accessToken,
    };
    this.persist(next);
  }

  /**
   * Met à jour UNIQUEMENT le token (utilisé par le refresh)
   * Cette méthode trigger le BehaviorSubject pour notifier tous les listeners (dont le socket)
   */
  setAccessToken(accessToken: string | null): void {
    const cur = this._auth$.value;
    const next: AuthState = {
      ...cur,
      accessToken,
      isAuthenticated: !!accessToken && !!cur.user,
    };
    this.persist(next);
  }

  setAuthenticated(user: AuthUser): void {
    const current = this.snapshot;
    this.persist({
      ...current,
      isAuthenticated: true,
      user,
    });
  }

  async forgotPassword(email: string) {
    return await firstValueFrom(this.api.forgotPassword(email));
  }

  async resetPassword(token: string, password: string) {
    return await firstValueFrom(this.api.resetPassword(password, token));
  }

  private persist(state: AuthState): void {
    this._auth$.next(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private async loadCurrentUser(source: 'password' | 'google'): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.getMe());

      const state: AuthState = {
        isAuthenticated: true,
        user: res.data as AuthUser,
        accessToken: null,
        source,
      };

      this.persist(state);
    } catch (error) {
      console.error('Failed to load user after login', error);
      this.logout();
    }
  }

  private async handleGoogleAuthSuccess(source: 'google') {
    const idToken = await fbAuth.currentUser!.getIdToken();
    await firstValueFrom(this.api.socialVerify(idToken)); // ou registerWithGoogle selon le cas
    await this.loadCurrentUser(source);
  }

  private clearAuthState(): void {
    this._auth$.next({
      isAuthenticated: false,
      user: null,
      source: null,
      accessToken: null,
    });
    localStorage.removeItem(STORAGE_KEY);
  }
}
