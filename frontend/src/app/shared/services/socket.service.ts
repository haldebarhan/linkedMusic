import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

export type SocketUnread = { total: number };

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket?: Socket;
  private unread$ = new BehaviorSubject<number>(0);

  constructor(private auth: AuthService) {
    this.auth.auth$.subscribe((s) => {
      if (s.isAuthenticated && s.accessToken) {
        this.connect(s.accessToken);
      } else {
        this.disconnect();
        this.unread$.next(0);
      }
    });
  }

  connect(token: string) {
    if (this.socket?.connected) return;
    this.socket = io(environment.socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      extraHeaders: { Authorization: `Bearer ${token}` },
    });

    this.socket.on('connect', () => {
      console.log('[socket] connected', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[socket] error', error);
    });

    this.socket.on('notif:unread', (p: SocketUnread) => {
      this.unread$.next(p?.total ?? 0);
    });

    this.socket.on('disconnect', () => {});
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = undefined;
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
