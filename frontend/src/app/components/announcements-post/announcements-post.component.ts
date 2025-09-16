import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-announcements-post',
  imports: [CommonModule],
  templateUrl: './announcements-post.component.html',
  styleUrl: './announcements-post.component.css',
})
export class AnnouncementsPostComponent implements OnInit {
  categories: any[] = [];
  loading = false;

  constructor(
    private readonly apiService: ApiService<any>,
    private readonly router: Router
  ) {}
  ngOnInit(): void {
    this.loading = true;
    this.apiService
      .getAll({
        endpoint: 'catalog/categories',
      })
      .subscribe({
        next: (res) => {
          this.categories = res.items.data;
        },
        error: (err) => console.error('err: ', err),
        complete: () => (this.loading = false),
      });
  }

  choose(c: any) {
    this.router.navigate(['/annonces/publier', c.slug]);
  }
}
