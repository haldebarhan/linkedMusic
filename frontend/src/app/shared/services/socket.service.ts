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
  private unreadNotifications$ = new BehaviorSubject<number>(0);
  private currentToken: string | null = null;
  private authSub?: Subscription;

  private notifications$ = new BehaviorSubject<any[]>([]);
  private newNotification$ = new BehaviorSubject<any | null>(null);

  constructor(private auth: AuthService) {
    this.initializeAuthListener();
  }

  /**
   * Initialise l'écoute des changements d'authentification
   */
  private initializeAuthListener(): void {
    this.authSub = this.auth.auth$
      .pipe(
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

        if (!nextToken) {
          this.currentToken = null;
          this.teardown();
          this.unread$.next(0);
          this.unreadNotifications$.next(0);
          return;
        }

        if (!this.socket) {
          this.currentToken = nextToken;
          this.createAndConnect(nextToken);
          return;
        }

        if (this.currentToken !== nextToken) {
          this.currentToken = nextToken;
          this.updateSocketAuth(nextToken);
        }
      });
  }

  /**
   * Crée et connecte le socket avec le token
   */
  private createAndConnect(token: string): void {
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

    this.socket.io.on('reconnect_attempt', (attemptNumber) => {
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

    this.socket.auth = { token: newToken };

    if (this.socket.connected) {
      this.socket.disconnect();
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, 100);
    } else {
      this.socket.connect();
    }
  }

  /**
   * Enregistre les handlers de base du socket
   */
  private registerCoreHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.loadNotifications();
    });

    this.socket.on('connect_error', (error: any) => {});

    this.socket.on('notif:unread', (payload: SocketUnread) => {
      const count = payload?.total ?? 0;
      this.unread$.next(count);
    });

    this.socket.on('notification:unread', (payload) => {
      const count = payload?.total ?? 0;
      this.unreadNotifications$.next(count);
    });

    this.socket.on('notification:data', (payload) => {
      let notifications: any[] = [];
      if (Array.isArray(payload)) {
        notifications = payload;
      } else if (payload.data && Array.isArray(payload.data)) {
        notifications = payload.data;
      } else if (payload.notifications) {
        notifications = payload.notifications;
      }

      this.notifications$.next(notifications);
    });

    this.socket.on('notification:new', (payload) => {
      let notification = payload.notification.notification;
      this.newNotification$.next(notification);

      const current = this.notifications$.value;
      this.notifications$.next([notification, ...current]);

      this.playNotificationSound();
    });

    this.socket.on('disconnect', (reason) => {
      if (reason === 'io client disconnect') {
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

  unreadNotificationsCount$(): Observable<number> {
    return this.unreadNotifications$.asObservable();
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

  /**
   * 🔥 AJOUT : Observable de la liste des notifications
   */
  notificationsList$(): Observable<any[]> {
    return this.notifications$.asObservable();
  }

  /**
   * 🔥 AJOUT : Observable des nouvelles notifications
   */
  incomingNotification$(): Observable<any | null> {
    return this.newNotification$.asObservable();
  }

  /**
   * 🔥 AJOUT : Demander le chargement des notifications
   */
  loadNotifications(): void {
    if (this.socket?.connected) {
      this.emit('notification:list');
    } else {
      console.warn('[Socket] Cannot load notifications, socket not connected');
    }
  }

  /**
   * 🔥 AJOUT : Marquer une notification comme lue
   */
  markNotificationAsRead(notificationId: number): void {
    this.emit('notification:markRead', { notificationId });
  }

  /**
   * 🔥 AJOUT : Marquer toutes les notifications comme lues
   */
  markAllNotificationsAsRead(): void {
    this.emit('notification:markAllRead');
  }

  /**
   * Joue un son de notification (optionnel)
   */
  private playNotificationSound(): void {
    try {
      const audio = new Audio('assets/audios/toast.ogg');
      audio.volume = 0.3;
      audio.play().catch((err) => {
        // Son désactivé ou pas disponible
      });
    } catch (error) {
      // Son désactivé ou pas disponible
    }
  }
}
