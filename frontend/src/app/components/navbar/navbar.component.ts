import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { AuthUser } from '../../shared/interfaces/auth';
import { AuthService } from '../../auth/auth.service';
import { SocketService } from '../../shared/services/socket.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  user$: Observable<AuthUser | null>;
  isLoggedIn$: Observable<boolean>;
  unread = 0;
  private sub?: Subscription;

  constructor(
    private router: Router,
    private auth: AuthService,
    private socketService: SocketService
  ) {
    this.user$ = this.auth.user$;
    this.isLoggedIn$ = this.auth.isLoggedIn$;
  }

  ngOnInit(): void {
    this.sub = this.socketService.unreadCount$().subscribe((n) => {
      this.unread = n;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
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
}
