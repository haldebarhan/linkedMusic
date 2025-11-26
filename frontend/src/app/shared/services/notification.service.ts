import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SocketService } from './socket.service';
import { Router } from '@angular/router';

export interface NotificationToast {
  id: number;
  type: 'success' | 'info' | 'warning' | 'error' | 'notification';
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
  show?: boolean;
}

const EVENTS = {
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_LIST: 'notification:list',
  NOTIFICATION_DATA: 'notification:data',
  NOTIFICATION_MARK_READ: 'notification:markRead',
  NOTIFICATION_MARK_ALL_READ: 'notification:markAllRead',
  NOTIFICATION_UNREAD: 'notification:unread',
} as const;

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<NotificationToast[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  // Queue des toasts à afficher
  private toastQueueSubject = new BehaviorSubject<NotificationToast[]>([]);
  public toastQueue$ = this.toastQueueSubject.asObservable();

  // Utiliser le compteur du SocketService existant
  public unreadCount$!: any;

  private isInitialized = false;

  constructor(private socket: SocketService, private router: Router) {
    console.log('🔔 NotificationService : Initialisation');
    // this.unreadCount$ = this.socket.unreadNotificationsCount$();
    this.initSocketListeners();

    // Si le socket est déjà connecté au moment de l'initialisation, charger immédiatement
    setTimeout(() => {
      if (this.socket.isConnected()) {
        console.log(
          "🔌 Socket déjà connecté à l'initialisation, chargement immédiat"
        );
        this.socket.emit(EVENTS.NOTIFICATION_LIST);
      }
    }, 1000);
  }

  /**
   * Initialise les listeners Socket.IO via le SocketService
   */
  private initSocketListeners(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log('🔔 NotificationService : Configuration des listeners');

    // 🔥 Écouter la connexion du socket pour charger automatiquement
    this.socket.on('connect', () => {
      console.log(
        '🔌 Socket connecté, chargement automatique des notifications'
      );
      // Petit délai pour laisser le backend s'initialiser
      setTimeout(() => {
        this.socket.emit(EVENTS.NOTIFICATION_LIST);
      }, 500);
    });

    // Nouvelle notification en temps réel
    this.socket.on<any>(EVENTS.NOTIFICATION_NEW, (payload) => {
      console.log('🔔 Nouvelle notification reçue:', payload);

      let notification: NotificationToast;

      if (payload.notification) {
        notification = this.mapToToast(payload.notification);
      } else {
        notification = this.mapToToast(payload);
      }

      // Ajouter à la liste des notifications
      const currentNotifications = this.notificationsSubject.value;
      this.notificationsSubject.next([notification, ...currentNotifications]);

      // Afficher le toast SEULEMENT si non lue
      if (!notification.isRead) {
        this.showToast(notification);

        // Jouer un son (optionnel)
        this.playNotificationSound();
      }
    });

    // Liste des notifications
    this.socket.on<any>(EVENTS.NOTIFICATION_DATA, (payload) => {
      console.log('📬 Données notifications reçues:', payload);

      let notifications: any[] = [];

      notifications = payload;
      const mappedNotifications = notifications.map((n) => this.mapToToast(n));
      console.log('🔔 Notifications mappées:', mappedNotifications);
      this.notificationsSubject.next(mappedNotifications);

      console.log('📦 Notifications stockées:', mappedNotifications.length);

      // 🔥 AFFICHER les notifications NON LUES comme toasts au chargement
      const unreadNotifications = mappedNotifications.filter((n) => !n.isRead);
      console.log(
        '🔥 Notifications non lues trouvées:',
        unreadNotifications.length
      );

      if (unreadNotifications.length > 0) {
        // Afficher les 3 dernières notifications non lues
        const toastsToShow = unreadNotifications.slice(0, 3);
        console.log('🎨 Affichage de', toastsToShow.length, 'toasts');

        toastsToShow.forEach((notification) => {
          this.showToast(notification);
        });
      } else {
        console.log('ℹ️ Aucune notification non lue à afficher');
      }
    });

    // Le compteur est déjà géré par SocketService via unreadNotificationsCount$()
  }

  /**
   * Mappe une notification vers le format Toast
   */
  private mapToToast(notification: any): NotificationToast {
    return {
      id: notification.id,
      type: this.getNotificationType(notification.type),
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
      isRead: notification.isRead || false,
      createdAt: new Date(notification.createdAt),
      show: true,
    };
  }

  /**
   * Détermine le type de notification pour le style
   */
  private getNotificationType(type: string): NotificationToast['type'] {
    const typeMap: { [key: string]: NotificationToast['type'] } = {
      // Annonces
      ANNOUNCEMENT_APPROVED: 'success',
      ANNOUNCEMENT_REJECTED: 'error',

      // Demandes de contact
      CONTACT_REQUEST_RECEIVED: 'info',
      CONTACT_REQUEST_ACCEPTED: 'success',
      CONTACT_REQUEST_REJECTED: 'error',

      // Messages
      MESSAGE_RECEIVED: 'info',

      // Abonnements
      SUBSCRIPTION_EXPIRING: 'warning',
      SUBSCRIPTION_EXPIRED: 'error',
    };
    return typeMap[type] || 'notification';
  }

  /**
   * Ajoute un toast à la queue d'affichage
   */
  private showToast(notification: NotificationToast): void {
    console.log('🎨 Affichage toast:', notification.title);

    const currentQueue = this.toastQueueSubject.value;

    // Limiter à 3 toasts simultanés
    if (currentQueue.length >= 3) {
      currentQueue.shift(); // Retirer le plus ancien
    }

    this.toastQueueSubject.next([...currentQueue, notification]);

    // Auto-dismiss après 5 secondes
    setTimeout(() => {
      this.dismissToast(notification.id);
    }, 5000);
  }

  /**
   * Retire un toast de la queue
   */
  dismissToast(notificationId: number): void {
    console.log('❌ Dismiss toast:', notificationId);
    const currentQueue = this.toastQueueSubject.value;
    const updatedQueue = currentQueue.filter((n) => n.id !== notificationId);
    this.toastQueueSubject.next(updatedQueue);
  }

  /**
   * Gère le clic sur une notification
   */
  handleNotificationClick(notification: NotificationToast): void {
    console.log('🖱️ Clic sur notification:', notification);

    // Marquer comme lue
    if (!notification.isRead) {
      this.markAsRead(notification.id);
    }

    // Retirer le toast
    this.dismissToast(notification.id);

    // Naviguer vers l'URL d'action si elle existe
    if (notification.actionUrl) {
      try {
        const url = new URL(notification.actionUrl, window.location.origin);
        const path = url.pathname + url.search + url.hash;
        this.router.navigateByUrl(path);
      } catch (error) {
        console.error('Erreur navigation:', error);
        this.router.navigateByUrl(notification.actionUrl);
      }
    }
  }

  /**
   * Marque une notification comme lue
   */
  markAsRead(notificationId: number): void {
    console.log('✅ Marquer comme lue:', notificationId);

    // Émettre au serveur
    this.socket.emit(EVENTS.NOTIFICATION_MARK_READ, { notificationId });

    // Mise à jour locale
    const notifications = this.notificationsSubject.value.map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    this.notificationsSubject.next(notifications);
  }

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead(): void {
    console.log('✅ Marquer toutes comme lues');

    // Émettre au serveur
    this.socket.emit(EVENTS.NOTIFICATION_MARK_ALL_READ);

    // Mise à jour locale
    const notifications = this.notificationsSubject.value.map((n) => ({
      ...n,
      isRead: true,
    }));
    this.notificationsSubject.next(notifications);
  }

  /**
   * Charge les notifications depuis le serveur
   * Attend que le socket soit vraiment connecté avant d'émettre
   */
  loadNotifications(): void {
    console.log('📤 Demande de chargement des notifications');

    if (this.socket.isConnected()) {
      console.log('✅ Socket déjà connecté, émission immédiate');
      this.socket.emit(EVENTS.NOTIFICATION_LIST);
      return;
    }

    // Socket pas encore connecté, écouter l'événement 'connect'
    console.log('⏳ Socket non connecté, attente de la connexion...');

    let isHandled = false;

    const connectHandler = () => {
      if (!isHandled) {
        isHandled = true;
        console.log('✅ Socket connecté, chargement des notifications');
        this.socket.emit(EVENTS.NOTIFICATION_LIST);
        this.socket.off('connect', connectHandler);
      }
    };

    this.socket.on('connect', connectHandler);

    // Timeout de sécurité après 5 secondes
    setTimeout(() => {
      if (!isHandled && this.socket.isConnected()) {
        isHandled = true;
        console.log('⏰ Timeout atteint, tentative de chargement');
        this.socket.emit(EVENTS.NOTIFICATION_LIST);
        this.socket.off('connect', connectHandler);
      } else if (!isHandled) {
        console.warn('⚠️ Socket non connecté après 5 secondes');
        this.socket.off('connect', connectHandler);
      }
    }, 5000);
  }

  /**
   * Joue un son de notification (optionnel)
   */
  private playNotificationSound(): void {
    try {
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch((err) => {
        // Son désactivé ou pas disponible
      });
    } catch (error) {
      // Son désactivé ou pas disponible
    }
  }

  /**
   * Obtenir toutes les notifications
   */
  getNotifications(): NotificationToast[] {
    return this.notificationsSubject.value;
  }

  /**
   * Obtenir le nombre de notifications non lues (depuis SocketService)
   */
  getUnreadCount(): number {
    // Utiliser le compteur du SocketService
    let count = 0;
    // this.socket
    //   .unreadNotificationsCount$()
    //   .subscribe((c) => (count = c))
    //   .unsubscribe();
    return count;
  }
}
