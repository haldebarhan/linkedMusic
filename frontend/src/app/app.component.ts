import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SearchbarComponent } from './components/searchbar/searchbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/auth.service';
import { RefreshTokenService } from './auth/refresh-token.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    SearchbarComponent,
    FooterComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'frontend';
  constructor(
    private router: Router,
    private auth: AuthService,
    private refresh: RefreshTokenService
  ) {}

  ngOnInit(): void {
    this.auth.init();
    this.refresh.startAutoRefresh();
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
    return currentRoute === '/admin' || currentRoute.startsWith('/admin');
  }
}
