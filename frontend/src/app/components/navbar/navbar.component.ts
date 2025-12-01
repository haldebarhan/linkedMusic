import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { AuthUser } from '../../shared/interfaces/auth';
import { AuthService } from '../../auth/auth.service';
import { SocketService } from '../../shared/services/socket.service';
import { Badge } from '../../shared/enums/badge.enum';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  user$: Observable<AuthUser | null>;
  isLoggedIn$: Observable<boolean>;

  unreadMessages = 0;
  totalNotifications = 0;
  private subscriptions = new Subscription();

  // Enum Badge accessible dans le template
  Badge = Badge;

  constructor(
    private router: Router,
    private auth: AuthService,
    private socketService: SocketService
  ) {
    this.user$ = this.auth.user$;
    this.isLoggedIn$ = this.auth.isLoggedIn$;
  }

  ngOnInit(): void {
    const messagesSub = this.socketService.unreadCount$().subscribe((count) => {
      this.unreadMessages = count;
      this.updateTotalNotifications();
    });

    const notificationsSub = this.socketService
      .unreadNotificationsCount$()
      .subscribe((count) => {
        this.updateTotalNotifications();
      });

    this.subscriptions.add(messagesSub);
    this.subscriptions.add(notificationsSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  displayName(u: AuthUser | null): string {
    if (!u) return '';
    const name = u.displayName
      ? u.displayName
      : [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;

    return name;
  }

  initials(u: AuthUser | null): string {
    const name = this.displayName(u);
    return name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  /**
   * Retourne le chemin vers l'icône du badge
   */
  getBadgeIcon(badge: Badge): string {
    const mapping: Record<Badge, string> = {
      [Badge.STANDARD]: '/assets/badges/badge_STANDARD.svg',
      [Badge.BRONZE]: '/assets/badges/badge_BRONZE.svg',
      [Badge.SILVER]: '/assets/badges/badge_ARGENT.svg',
      [Badge.GOLD]: '/assets/badges/badge_OR.svg',
      [Badge.VIP]: '/assets/badges/badge_VIP.svg',
      [Badge.VVIP]: '/assets/badges/badge_VVIP.svg',
    };
    return mapping[badge] || '';
  }

  /**
   * Retourne le label du badge
   */
  getBadgeLabel(badge: Badge): string {
    const mapping: Record<Badge, string> = {
      [Badge.STANDARD]: 'Standard',
      [Badge.BRONZE]: 'Bronze',
      [Badge.SILVER]: 'Argent',
      [Badge.GOLD]: 'Or',
      [Badge.VIP]: 'VIP',
      [Badge.VVIP]: 'VVIP',
    };
    return mapping[badge] || badge;
  }

  private updateTotalNotifications(): void {
    this.totalNotifications = this.unreadMessages;
  }
}
