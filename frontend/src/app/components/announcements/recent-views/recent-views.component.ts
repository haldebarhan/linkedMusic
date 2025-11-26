import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, finalize, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SweetAlert, Toast } from '../../../helpers/sweet-alert';

interface RecentView {
  id: number;
  announcementId: number;
  viewedAt: string;
  announcement: {
    id: number;
    title: string;
    location?: string;
    status: string;
  };
}

@Component({
  selector: 'app-recent-views',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recent-views.component.html',
  styleUrl: './recent-views.component.css',
})
export class RecentViewsComponent implements OnInit {
  metadata = { total: 0, page: 1, totalPage: 1 };
  pages: number[] = [];
  loading = false;
  order = 'desc';
  sub?: Subscription;
  rows: RecentView[] = [];
  page = 1;
  limit = 20;
  total = 0;
  totalPage = 1;
  deleting = false;

  constructor(
    private api: ApiService<any>,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((qp) => {
      this.page = +(qp['page'] ?? 1);
      this.limit = +(qp['limit'] ?? this.limit);
      this.order = qp['order'] ?? this.order;
      const patch: any = {};
      if ('order' in qp) patch.sort = qp['order'];
      this.loadViews(this.page);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadViews(page: number, limit = 20) {
    this.loading = true;
    this.api
      .getAll({
        endpoint: 'users/announcements/recent-views',
        params: {
          page,
          limit,
          order: this.order,
        },
      })
      .subscribe({
        next: (res: any) => {
          const items = res.data.data || res.data;
          const meta = res.data.pagination || res.meta;
          this.rows = items;

          if (meta) {
            this.metadata = {
              total: meta.total || meta.totalCount,
              totalPage:
                meta.totalPages ||
                Math.ceil((meta.total || meta.totalCount) / limit),
              page: meta.page || page,
            };
            this.totalPage = this.metadata.totalPage;
            this.total = this.metadata.total;
          } else {
            this.metadata = {
              total: items.length,
              totalPage: 1,
              page: 1,
            };
            this.total = items.length;
            this.totalPage = 1;
          }

          this.pages = this.buildPages(
            this.metadata.page,
            this.metadata.totalPage
          );
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des vues:', err);
          this.loading = false;
          Toast.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Impossible de charger vos vues récentes',
          });
        },
      });
  }

  removeView(view: any, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    const id = view.viewsId;
    SweetAlert.fire({
      title: 'Retirer cette annonce de votre historique ?',
      icon: 'question',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, confirmer',
      cancelButtonText: 'Annuler',
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleting = true;
        this.api
          .delete('users/announcements/recent-views', id)
          .pipe(finalize(() => (this.deleting = false)))
          .subscribe({
            next: () => {
              Toast.fire({
                title: 'Retiré',
                icon: 'success',
                didClose: () => {
                  this.loadViews(this.page);
                },
              });
            },
            error: (err) => {
              console.error('Erreur lors de la suppression:', err);
              Toast.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible de retirer cette vue',
              });
            },
          });
      }
    });
  }

  clearAllHistory(event: Event) {
    event.preventDefault();
    SweetAlert.fire({
      title: 'Confimer',
      text: 'Êtes-vous sûr de vouloir effacer tout votre historique de vues ? Cette action est irréversible.',
      icon: 'warning',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, confirmer',
      cancelButtonText: 'Annuler',
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleting = true;
        this.api
          .delete('users/announcements/clear/recent-views')
          .pipe(finalize(() => (this.deleting = false)))
          .subscribe({
            next: () => {
              Toast.fire({
                title: 'Supprimé',
                icon: 'success',
                didClose: () => {
                  this.deleting = false;
                  this.loadViews(this.page);
                },
              });
            },
            error: (err) => {
              console.error("Erreur lors de l'effacement:", err);
              Toast.fire({
                icon: 'error',
                title: 'Erreur',
                text: "Impossible d'effacer l'historique",
              });
            },
          });
      }
    });
  }

  go(p: number) {
    if (p < 1 || p > this.totalPage || p === this.page) return;
    this.page = p;
    this.loadViews(p);
  }

  private buildPages(current: number, last: number) {
    const max = 7;
    let start = Math.max(1, current - Math.floor(max / 2));
    let end = Math.min(last, start + max - 1);
    start = Math.max(1, end - max + 1);
    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  get start() {
    return this.total ? (this.page - 1) * this.limit + 1 : 0;
  }

  get end() {
    return (this.page - 1) * this.limit + this.rows.length;
  }
}
