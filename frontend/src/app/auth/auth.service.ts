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
    private userUpdateService: UserUpdateService
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
    return this._auth$.value.accessToken;
  }

  get snapshot() {
    return this._auth$.value;
  }

  init(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this._auth$.next(JSON.parse(raw));
      } catch {}
    }
  }

  async loginWithPassword(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.api.loginWithPassword({ email, password })
    );
    const state: AuthState = {
      isAuthenticated: true,
      user: res.data.user as AuthUser,
      accessToken: res.data.accessToken,
      source: 'password',
    };
    this.persist(state);
  }

  async activateAccount(email: string, token: string): Promise<void> {
    const res = await firstValueFrom(
      this.api.activateAccount({ email, token })
    );
    const state: AuthState = {
      isAuthenticated: true,
      user: res.data.user as AuthUser,
      accessToken: res.data.accessToken,
      source: 'password',
    };
    this.persist(state);
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(fbAuth, provider);

    const idToken = await fbAuth.currentUser!.getIdToken();
    const res = await firstValueFrom(this.api.socialVerify(idToken));

    const state: AuthState = {
      isAuthenticated: true,
      user: res.data.user as AuthUser,
      accessToken: res.data.accessToken ?? null,
      source: 'google',
    };
    this.persist(state);
  }

  async registerWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(fbAuth, provider);
    const idToken = await fbAuth.currentUser!.getIdToken();
    const res = await firstValueFrom(this.api.registerWithGoogle(idToken));
    const state: AuthState = {
      isAuthenticated: true,
      user: res.data.user as AuthUser,
      accessToken: res.data.accessToken ?? null,
      source: 'google',
    };
    this.persist(state);
  }

  async loginWithGoogleRedirect(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(fbAuth, provider);
  }

  async getMe() {
    return await firstValueFrom(this.api.getMe());
  }

  /** Déconnexion */
  async logout(): Promise<void> {
    try {
      await fbAuth.signOut();
    } catch {}
    this.persist({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      source: null,
    });
    localStorage.removeItem(STORAGE_KEY);
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
}
