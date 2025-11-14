import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

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
    this.authSub = this.auth.auth$.subscribe((s) => {
      const nextToken = s.isAuthenticated ? s.accessToken ?? null : null;
      if (!nextToken) {
        this.currentToken = null;
        this.teardown();
        this.unread$.next(0);
        return;
      }

      if (!this.socket) {
        this.currentToken = nextToken;
        this.createAndConnect(nextToken);
        return;
      }

      if (this.currentToken !== nextToken) {
        this.currentToken = nextToken;
        this.socket.auth = { token: nextToken };

        if (this.socket.connected) {
          this.socket.disconnect(); // stoppe net la session courante
        }
        this.socket.connect(); // reconnecte immédiatement avec le nouveau token
      }
    });
  }

  private createAndConnect(token: string) {
    this.socket = io(environment.socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: { token }, // <- PAS d’extraHeaders en navigateur
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      autoConnect: true,
    });

    // À chaque tentative de reconnexion, renvoyer le token le plus récent
    this.socket.io.on('reconnect_attempt', () => {
      if (this.currentToken) this.socket!.auth = { token: this.currentToken };
    });

    this.registerCoreHandlers();
  }

  private registerCoreHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[socket] connected', this.socket?.id);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('[socket] connect_error', error);
    });

    this.socket.on('notif:unread', (p: SocketUnread) => {
      this.unread$.next(p?.total ?? 0);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[socket] disconnected', reason);
    });
  }

  private teardown() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = undefined;
    }
  }

  on<T = any>(event: string, cb: (payload: T) => void) {
    this.socket?.on(event, cb);
  }
  off(event: string, cb?: (...args: any[]) => void) {
    this.socket?.off(event, cb);
  }
  emit(event: string, payload?: any) {
    this.socket?.emit(event, payload);
  }
  unreadCount$(): Observable<number> {
    return this.unread$.asObservable();
  }
}
