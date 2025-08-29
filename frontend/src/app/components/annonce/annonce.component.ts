import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Announcement } from '../../shared/interfaces/annoncement';

@Component({
  selector: 'app-annonce',
  imports: [CommonModule],
  templateUrl: './annonce.component.html',
  styleUrl: './annonce.component.css',
})
export class AnnonceComponent implements OnInit {
  metadata: { total: number; page: number; totalPage: number } | null = null;
  ads: Announcement[] = [];
  pages: number[] = [];
  endpoint: string = 'announcements';
  isMobile = false;
  isLoading = false;
  showBackToTop = false;
  category: string = '';
  lastScrollTop = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly apiService: ApiService<Announcement>
  ) {}

  ngOnInit(): void {
    this.isMobile = window.innerWidth <= 768;
    this.route.paramMap.subscribe((params) => {
      this.category = params.get('category') || '';
      this.ads = [];
      this.loadResults(1);
    });
  }

  loadResults(page: number) {
    if (!this.category) return;
    this.isLoading = true;
    this.apiService.getAll(this.endpoint).subscribe({
      next: (response) => {
        if (this.isMobile && this.metadata && page > 1) {
          this.ads = [...this.ads, ...response.items.data];
        } else {
          this.ads = response.items.data;
        }
        this.metadata = response.items.metadata;
        const totalPages = this.metadata.totalPage;
        const currentPage = this.metadata.page;
        this.pages =
          totalPages > 5
            ? Array.from({ length: totalPages }, (_, i) => i + 1)
            : Array.from({ length: Math.min(5, totalPages) }, (_, i) =>
                currentPage + i <= totalPages ? currentPage + i : totalPages
              );
        this.isLoading = false;
      },
      error: (err) => console.error(err),
    });
  }

  changePage(page: number) {
    if (this.metadata && (page < 1 || page > this.metadata.totalPage)) return;
    this.loadResults(page);
    this.scrollToTop();
  }

  loadMore() {
    if (this.metadata && this.metadata.page < this.metadata.totalPage) {
      this.loadResults(this.metadata.page + 1);
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (this.isMobile) {
      const st = window.scrollY;
      this.showBackToTop = st < this.lastScrollTop && st > 400; // apparaît quand user remonte
      this.lastScrollTop = st;
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        this.loadMore();
      }
    }
  }
}
