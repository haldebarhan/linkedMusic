import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SearchbarComponent } from './components/searchbar/searchbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { CommonModule } from '@angular/common';

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
export class AppComponent {
  title = 'frontend';
  constructor(private router: Router) {}

  showSearchBar(): boolean {
    const currentRoute = this.router.url;
    return (
      currentRoute === '/' ||
      currentRoute.startsWith('/annonces') ||
      currentRoute.startsWith('/favorites') ||
      currentRoute.startsWith('/searches') ||
      currentRoute.startsWith('/home')
    );
  }
}
