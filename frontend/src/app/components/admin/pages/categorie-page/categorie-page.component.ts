import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SweetAlert } from '../../../../helpers/sweet-alert';
import { ApiService } from '../../../../shared/services/api.service';
import { PaginationService } from '../../../../shared/services/pagination.service';

@Component({
  selector: 'app-categorie-page',
  imports: [CommonModule],
  templateUrl: './categorie-page.component.html',
  styleUrl: './categorie-page.component.css',
  providers: [PaginationService],
})
export class CategoriePageComponent implements OnInit {
  rows: any[] = [];

  pages: number[] = [];
  constructor(
    private api: ApiService,
    private router: Router,
    publicApi: ApiService<any>,
    public paginationService: PaginationService<any>,
  ) {}

  ngOnInit(): void {
    this.paginationService.init((page, limit, cursor) =>
      this.listCategories(page, limit, cursor),
    );
    this.listCategories(
      this.paginationService.page,
      this.paginationService.pagination.limit,
      this.paginationService.cursor,
    );
  }
  listCategories(page: number, limit = 10, cursor?: number | string | null) {
    this.api
      .listResources({
        endpoint: 'categories',
        page,
        limit,
        cursor: cursor == null ? cursor : Number(cursor),
      })
      .subscribe({
        next: (res) => {
          this.rows = res.items.data;
          this.paginationService.pagination = {
            limit: res.items.metadata.limit,
            hasNext: res.items.metadata.hasNext,
            nextCursor:
              res.items.metadata.nextCursor == null
                ? null
                : String(res.items.metadata.nextCursor),
          };
        },
        error: (err) => console.error(err),
      });
  }

  goToEdit(catgory: any) {
    this.router.navigate(['/admin/categories/edit', catgory.id]);
  }
  removeCategory(categorie: any) {
    SweetAlert.fire({
      title: 'Etes-vous sure ?',
      icon: 'warning',
      text: `Vous allez supprimer la catégorie ${categorie.name}`,
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, je confirme',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.api
          .updateResource('categories/desable', categorie.id, {})
          .subscribe({
            next: () => {
              SweetAlert.fire({
                title: 'Supprimé!',
                text: `${categorie.name} a bien ete supprimé`,
                icon: 'success',
                didClose: () => {
                  this.listCategories(
                    this.paginationService.page,
                    this.paginationService.pagination.limit,
                    this.paginationService.cursor,
                  );
                },
              });
            },
          });
      }
    });
  }

  goToCreate() {
    this.router.navigate(['/admin/categories/new']);
  }

  goToDetails(category: any) {
    this.router.navigate(['/admin/categories', category.id]);
  }
}
