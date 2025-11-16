import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SearchbarComponent } from './components/searchbar/searchbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/auth.service';
import { RefreshTokenService } from './auth/refresh-token.service';
import { Subscription } from 'rxjs';
import { SocketService } from './shared/services/socket.service';

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
export class AppComponent implements OnInit, OnDestroy {
  title = 'ZikMusic';
  private subscriptions = new Subscription();
  constructor(
    private router: Router,
    private auth: AuthService,
    private refresh: RefreshTokenService,
    private socketService: SocketService
  ) {
    console.log('[App] Application constructeur appelé');
  }

  ngOnInit(): void {
    console.log("[App] Initialisation de l'application...");
    this.auth.init();

    this.refresh.startAutoRefresh();
    console.log('[App] ✅ Système de refresh automatique démarré');

    // 3. (Optionnel) S'abonner aux changements d'authentification
    this.subscriptions.add(
      this.auth.auth$.subscribe((state) => {
        if (state.isAuthenticated) {
          console.log('[App] Utilisateur authentifié:', state.user?.email);
        } else {
          console.log('[App] Utilisateur non authentifié');
        }
      })
    );

    // 4. (Optionnel) S'abonner au nombre de notifications
    this.subscriptions.add(
      this.socketService.unreadCount$().subscribe((count) => {
        console.log('[App] Notifications non lues:', count);
      })
    );

    console.log('[App] ✅ Application initialisée avec succès');
  }
  ngOnDestroy(): void {
    // Nettoyer les subscriptions
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
    return currentRoute === '/admin' || currentRoute.startsWith('/admin');
  }
}
