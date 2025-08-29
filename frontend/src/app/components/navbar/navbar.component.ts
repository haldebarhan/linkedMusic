import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthUser } from '../../shared/interfaces/auth';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  user$: Observable<AuthUser | null>;
  isLoggedIn$: Observable<boolean>;
  isLoggedIn = false;

  constructor(private router: Router, private auth: AuthService) {
    this.user$ = this.auth.user$;
    this.isLoggedIn$ = this.auth.isLoggedIn$;
  }

  toggleUserState() {
    this.isLoggedIn = !this.isLoggedIn;
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
    return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
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
