import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SearchbarComponent } from './components/searchbar/searchbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/auth.service';
import { RefreshTokenService } from './auth/refresh-token.service';
import { Subscription } from 'rxjs';
import { NotificationComponent } from './shared/components/notification/notification.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    SearchbarComponent,
    FooterComponent,
    NotificationComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ZikMusic';
  private subscriptions = new Subscription();
  constructor(
    private router: Router,
    private auth: AuthService,
    private refresh: RefreshTokenService
  ) {}

  ngOnInit(): void {
    this.auth.init();
    this.refresh.startAutoRefresh();
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  showSearchBar(): boolean {
    const currentRoute = this.router.url;
    return (
      currentRoute === '/' ||
      currentRoute.startsWith('/annonces') ||
      currentRoute.startsWith('/favorites') ||
      currentRoute.startsWith('/searches') ||
      currentRoute.startsWith('/home') ||
      currentRoute.startsWith('/profile')
    );
  }

  desableNavBarAndFooter(): boolean {
    const currentRoute = this.router.url;
    return (
      currentRoute === '/admin' ||
      currentRoute.startsWith('/admin') ||
      currentRoute.startsWith('/users')
    );
  }
}
