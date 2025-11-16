import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

export type SocketUnread = { total: number };

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket?: Socket;
  private unread$ = new BehaviorSubject<number>(0);
  private currentToken: string | null = null;
  private authSub?: Subscription;

  constructor(private auth: AuthService) {
    this.initializeAuthListener();
  }

  /**
   * Initialise l'écoute des changements d'authentification
   */
  private initializeAuthListener(): void {
    this.authSub = this.auth.auth$
      .pipe(
        // Optimisation: ne réagir que si le token ou l'état d'auth change réellement
        distinctUntilChanged(
          (prev, curr) =>
            prev.accessToken === curr.accessToken &&
            prev.isAuthenticated === curr.isAuthenticated
        )
      )
      .subscribe((state) => {
        const nextToken = state.isAuthenticated
          ? state.accessToken ?? null
          : null;

        // console.log('[Socket] Auth state changed:', {
        //   isAuthenticated: state.isAuthenticated,
        //   hasToken: !!nextToken,
        //   tokenChanged: this.currentToken !== nextToken,
        // });

        // Si pas de token, déconnecter le socket
        if (!nextToken) {
          this.currentToken = null;
          this.teardown();
          this.unread$.next(0);
          return;
        }

        // Si pas de socket existant, créer et connecter
        if (!this.socket) {
          this.currentToken = nextToken;
          this.createAndConnect(nextToken);
          return;
        }

        // Si le token a changé, mettre à jour l'authentification du socket
        if (this.currentToken !== nextToken) {
          //   console.log('[Socket] Token changed, updating socket auth...');
          this.currentToken = nextToken;
          this.updateSocketAuth(nextToken);
        }
      });
  }

  /**
   * Crée et connecte le socket avec le token
   */
  private createAndConnect(token: string): void {
    console.log('[Socket] Creating new socket connection');

    this.socket = io(environment.socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      autoConnect: true,
    });

    // À chaque tentative de reconnexion, utiliser le token le plus récent
    this.socket.io.on('reconnect_attempt', (attemptNumber) => {
      //   console.log(`[Socket] Reconnect attempt #${attemptNumber}`);
      if (this.currentToken) {
        this.socket!.auth = { token: this.currentToken };
      }
    });

    this.registerCoreHandlers();
  }

  /**
   * Met à jour l'authentification du socket avec un nouveau token
   */
  private updateSocketAuth(newToken: string): void {
    if (!this.socket) return;

    // Mettre à jour l'auth
    this.socket.auth = { token: newToken };

    // Si le socket est connecté, le forcer à se reconnecter avec le nouveau token
    if (this.socket.connected) {
      //   console.log('[Socket] Disconnecting to reconnect with new token');
      this.socket.disconnect();

      // Petit délai avant de reconnecter pour éviter les race conditions
      setTimeout(() => {
        if (this.socket) {
          //   console.log('[Socket] Reconnecting with new token');
          this.socket.connect();
        }
      }, 100);
    } else {
      // Si déjà déconnecté, juste connecter
      //   console.log('[Socket] Connecting with new token');
      this.socket.connect();
    }
  }

  /**
   * Enregistre les handlers de base du socket
   */
  private registerCoreHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      //   console.log('[Socket] Connected successfully, ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (error: any) => {
      //   console.error('[Socket] Connection error:', error.message);
    });

    this.socket.on('notif:unread', (payload: SocketUnread) => {
      const count = payload?.total ?? 0;
      //   console.log('[Socket] Unread notifications:', count);
      this.unread$.next(count);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected, reason:', reason);

      // Si la déconnexion est volontaire, ne pas essayer de reconnecter
      if (reason === 'io client disconnect') {
        // console.log('[Socket] Client-side disconnect, not reconnecting');
      }
    });

    this.socket.on('error', (error: any) => {
      console.error('[Socket] Socket error:', error);
    });
  }

  /**
   * Nettoie complètement le socket
   */
  private teardown(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = undefined;
    }
  }

  /**
   * Écoute un événement du socket
   */
  on<T = any>(event: string, cb: (payload: T) => void): void {
    this.socket?.on(event, cb);
  }

  /**
   * Arrête d'écouter un événement
   */
  off(event: string, cb?: (...args: any[]) => void): void {
    this.socket?.off(event, cb);
  }

  /**
   * Émet un événement vers le serveur
   */
  emit(event: string, payload?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, payload);
    } else {
      console.warn('[Socket] Cannot emit, socket not connected');
    }
  }

  /**
   * Observable du nombre de notifications non lues
   */
  unreadCount$(): Observable<number> {
    return this.unread$.asObservable();
  }

  /**
   * Vérifie si le socket est connecté
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Nettoie les subscriptions (à appeler dans ngOnDestroy si nécessaire)
   */
  destroy(): void {
    if (this.authSub) {
      this.authSub.unsubscribe();
      this.authSub = undefined;
    }
    this.teardown();
  }
}
