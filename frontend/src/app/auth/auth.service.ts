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
    // si tu veux gérer le flow redirect (iOS/Safari)
    getRedirectResult(fbAuth).catch(() => {});

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

  init(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this._auth$.next(JSON.parse(raw));
      } catch {}
    }
  }

  get snapshot() {
    return this._auth$.value;
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  // ====== 2) Login Google via Firebase ======
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

  async loginWithGoogleRedirect(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(fbAuth, provider);
  }

  /** Met à jour le token backend (ex: après refresh) */
  setAccessToken(accessToken: string | null) {
    const cur = this._auth$.value;
    const next = {
      ...cur,
      accessToken,
      isAuthenticated: !!accessToken && !!cur.user,
    };
    this._auth$.next(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private persist(state: AuthState) {
    this._auth$.next(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
