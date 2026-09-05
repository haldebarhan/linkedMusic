import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../../shared/services/api.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { PaginationService } from '../../../../shared/services/pagination.service';

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
  providers: [PaginationService],
})
export class SubscriptionPlansComponent implements OnInit {
  rows: Subscription[] = [];
  page = 1;
  pages: number[] = [];
  expanded?: boolean;

  constructor(
    private api: ApiService<Subscription>,
    private router: Router,
    public paginationService: PaginationService,
  ) {}
  ngOnInit(): void {
    this.paginationService.init((page, limit, cursor) =>
      this.listData(page, limit, cursor),
    );
    this.listData(
      this.paginationService.page,
      this.paginationService.pagination.limit,
      this.paginationService.cursor,
    );
  }

  listData(page: number, limit = 10, cursor?: number | string | null) {
    this.api
      .listData({
        endpoint: 'subscription-plans',
        page,
        limit,
        cursor: cursor === null ? undefined : Number(cursor),
      })
      .subscribe({
        next: (res) => {
          this.rows = res.items.data;
        },
        error: (err) => console.error(err),
      });
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
                this.listData(this.page, this.paginationService.pagination.limit, this.paginationService.cursor);
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
