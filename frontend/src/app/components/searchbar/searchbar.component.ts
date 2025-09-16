import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-searchbar',
  imports: [],
  templateUrl: './searchbar.component.html',
  styleUrl: './searchbar.component.css',
})
export class SearchbarComponent {
  constructor(private readonly router: Router) {}

  createAnnouncement() {
    this.router.navigate(['/annonces/publier']);
  }
}
