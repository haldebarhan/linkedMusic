import { Component, OnInit } from '@angular/core';
import { AdminApi } from '../../data/admin-api.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { buildPages } from '../../../../helpers/build-page';
import Swal from 'sweetalert2';

export interface Subscription {
  id: number;
  name: string;
  status: boolean;
  period: string;
  price: number;
  benefits: { id?: number; label: string }[];
  expanded?: boolean;
}

@Component({
  selector: 'app-subscription-plans',
  imports: [CommonModule, RouterLink],
  templateUrl: './subscription-plans.component.html',
  styleUrl: './subscription-plans.component.css',
})
export class SubscriptionPlansComponent implements OnInit {
  rows: Subscription[] = [];
  page = 1;
  limit = 10;
  total = 0;
  totalPage = 1;
  pages: number[] = [];
  expanded?: boolean;

  constructor(private api: AdminApi, private router: Router) {}
  ngOnInit(): void {
    this.listData(this.page);
  }

  listData(page: number, limit = 10) {
    this.api
      .listData({ endpoint: 'subscription-plans', page, limit })
      .subscribe({
        next: (res) => {
          this.rows = res.items.data;
          const meta = res.items.metadata ?? {
            total: 0,
            page: 1,
            totalPage: 1,
          };
          this.total = meta.total;
          this.totalPage = meta.totalPage;
          this.page = meta.page;
          this.pages = buildPages(this.page, this.totalPage);
        },
        error: (err) => console.error(err),
      });
  }

  go(p: number) {
    if (p < 1 || p > this.totalPage || p === this.page) return;
    this.page = p;
    this.listData(p);
  }

  get start() {
    return this.total ? (this.page - 1) * this.limit + 1 : 0;
  }
  get end() {
    return (this.page - 1) * this.limit + this.rows.length;
  }

  toggleRow(field: Subscription): void {
    field.expanded = !field.expanded;
  }

  formatStatus(status: boolean): string {
    return status === true ? 'Actif' : 'Inactif';
  }

  remove(field: Subscription) {
    Swal.fire({
      title: 'Etes-vous sûr ?',
      icon: 'warning',
      html: `Cette action va supprimer le plan <strong>"${field.name}"</strong><br> Les abonnement liés à ce plan seront préservés jusqu'a leur expiration.`,
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Annuler',
      confirmButtonText: 'Oui, Supprimer',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.removeData('subscription-plans', field.id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Supprimé!',
              text: 'Le Plan a été supprimé',
              icon: 'success',
              didClose: () => {
                this.listData(this.page);
              },
            });
          },
          error: () => {
            Swal.fire({
              title: 'Erreur!',
              text: 'Une erreur est survenue lors de la suppression du plan',
              icon: 'error',
            });
          },
        });
      }
    });
  }
  edit(field: Subscription) {
    this.router.navigate(['/admin/subscription-plans/edit/', field.id]);
  }
}
