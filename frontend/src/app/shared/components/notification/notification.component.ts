import { Component, OnDestroy, OnInit } from '@angular/core';
import { NotificationToast } from '../../services/notification.service';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../services/socket.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notification',
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css',
})
export class NotificationComponent implements OnInit, OnDestroy {
  toasts: NotificationToast[] = [];
  unreadCount: number = 0;

  private allUnreadNotifications: NotificationToast[] = [];

  private destroy$ = new Subject<void>();

  constructor(private socket: SocketService, private router: Router) {}

  ngOnInit(): void {
    this.socket
      .unreadNotificationsCount$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.unreadCount = count;
      });

    this.socket
      .notificationsList$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        if (notifications.length > 0) {
          this.allUnreadNotifications = notifications
            .filter((n) => !n?.isRead)
            .map((n) => this.mapToToast(n));

          this.updateToastQueue();
        }
      });

    this.socket
      .incomingNotification$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        if (notification && !notification.isRead) {
          const toast = this.mapToToast(notification);

          this.allUnreadNotifications.unshift(toast);

          this.updateToastQueue();
        }
      });
  }

  /**
   * Met à jour la queue des toasts affichés (max 3)
   */
  private updateToastQueue(): void {
    const currentIds = this.toasts.map((t) => t.id);

    const notDisplayed = this.allUnreadNotifications.filter(
      (n) => !currentIds.includes(n.id)
    );

    const availableSlots = 3 - this.toasts.length;

    if (availableSlots > 0 && notDisplayed.length > 0) {
      const toAdd = notDisplayed.slice(0, availableSlots);

      this.toasts = [...this.toasts, ...toAdd];
    } else if (this.toasts.length === 0) {
      this.toasts = this.allUnreadNotifications.slice(0, 3);
    }
  }

  /**
   * Gère le clic sur un toast
   */
  handleClick(notification: NotificationToast): void {
    if (!notification.isRead) {
      try {
        const maybeObsOrPromise: unknown = this.socket.markNotificationAsRead(
          notification.id
        );
        if (
          typeof maybeObsOrPromise === 'object' &&
          maybeObsOrPromise !== null &&
          'subscribe' in maybeObsOrPromise &&
          typeof (maybeObsOrPromise as any).subscribe === 'function'
        ) {
          (maybeObsOrPromise as any).subscribe({
            next: () => {
              /* ok */
            },
            error: (err: any) =>
              console.error('Erreur marquage read (observable):', err),
          });
        } else if (
          typeof maybeObsOrPromise === 'object' &&
          maybeObsOrPromise !== null &&
          'then' in maybeObsOrPromise &&
          typeof (maybeObsOrPromise as any).then === 'function'
        ) {
          (maybeObsOrPromise as any).catch((err: any) =>
            console.error('Erreur marquage read (promise):', err)
          );
        }
      } catch (err) {
        console.error('Erreur lors de markNotificationAsRead:', err);
      }
    }

    this.removeNotificationFromQueues(notification.id);

    if (notification.actionUrl) {
      try {
        const url = new URL(notification.actionUrl, window.location.origin);
        const path = url.pathname + url.search + url.hash;
        this.router.navigateByUrl(path);
      } catch (error) {
        this.router.navigateByUrl(notification.actionUrl);
      }
    }
  }

  /**
   * Ferme un toast
   */
  dismiss(notificationId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    try {
      const maybeObsOrPromise: unknown =
        this.socket.markNotificationAsRead(notificationId);
      if (
        typeof maybeObsOrPromise === 'object' &&
        maybeObsOrPromise !== null &&
        'subscribe' in maybeObsOrPromise &&
        typeof (maybeObsOrPromise as any).subscribe === 'function'
      ) {
        (maybeObsOrPromise as any).subscribe({
          next: () => {},
          error: (err: any) => {
            console.error('Erreur marquage read (observable):', err);
          },
        });
      } else if (
        typeof maybeObsOrPromise === 'object' &&
        maybeObsOrPromise !== null &&
        'then' in maybeObsOrPromise &&
        typeof (maybeObsOrPromise as any).then === 'function'
      ) {
        (maybeObsOrPromise as any).catch((err: any) => {
          console.error('Erreur marquage read (promise):', err);
        });
      }
    } catch (err) {
      console.error('Erreur lors de markNotificationAsRead:', err);
    }
    this.removeNotificationFromQueues(notificationId);
  }

  /**
   * Ferme un toast et met à jour la queue
   */
  dismissToast(notificationId: number): void {
    this.removeNotificationFromQueues(notificationId);
  }

  /**
   * Retourne la classe d'icône selon le type
   */
  getIconClass(type: string): string {
    const iconMap: { [key: string]: string } = {
      success: 'bi-check-circle-fill',
      info: 'bi-info-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      error: 'bi-x-circle-fill',
      notification: 'bi-bell-fill',
    };
    return iconMap[type] || 'bi-bell-fill';
  }

  /**
   * TrackBy pour optimiser le rendu
   */
  trackById(index: number, notification: NotificationToast): number {
    return notification.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    };
  }

  /**
   * Détermine le type de notification pour le style
   */
  private getNotificationType(type: string): NotificationToast['type'] {
    const typeMap: { [key: string]: NotificationToast['type'] } = {
      ANNOUNCEMENT_APPROVED: 'success',
      ANNOUNCEMENT_CREATED: 'success',
      ANNOUNCEMENT_REJECTED: 'error',
      CONTACT_REQUEST_RECEIVED: 'info',
      CONTACT_REQUEST_ACCEPTED: 'success',
      CONTACT_REQUEST_REJECTED: 'error',
      MESSAGE_RECEIVED: 'info',
      SUBSCRIPTION_EXPIRING: 'warning',
      SUBSCRIPTION_EXPIRED: 'error',
    };
    return typeMap[type] || 'notification';
  }

  private removeNotificationFromQueues(notificationId: number): void {
    // Retirer de la liste affichée
    this.toasts = this.toasts.filter((t) => t.id !== notificationId);

    // Retirer de la liste complète des non lus
    const before = this.allUnreadNotifications.length;
    this.allUnreadNotifications = this.allUnreadNotifications.filter(
      (n) => n.id !== notificationId
    );
    const after = this.allUnreadNotifications.length;

    // Si tu gères un compteur local (au cas où le socket ne le met pas à jour), décrémente-le
    if (before > after) {
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    }

    // Mettre à jour la queue d'affichage pour afficher la notification suivante (s'il y en a)
    this.updateToastQueue();
  }
}
