import { Component, OnInit } from '@angular/core';
import { SweetAlert } from '../../../../helpers/sweet-alert';
import { ApiService } from '../../../../shared/services/api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PaginationService } from '../../../../shared/services/pagination.service';

@Component({
  selector: 'app-fields',
  imports: [CommonModule],
  templateUrl: './fields.component.html',
  styleUrl: './fields.component.css',
  providers: [PaginationService],
})
export class FieldsComponent implements OnInit {
  rows: any[] = [];

  pages: number[] = [];

  constructor(
    private api: ApiService,
    private router: Router,
    public paginationService: PaginationService,
  ) {}

  ngOnInit(): void {
    this.paginationService.init((page, limit, cursor) =>
      this.listFields(page, limit, cursor),
    );
    this.listFields(
      this.paginationService.page,
      this.paginationService.pagination.limit,
      this.paginationService.cursor,
    );
  }

  listFields(page: number, limit = 10, cursor?: number | string | null) {
    this.api
      .listAdminResources({
        endpoint: 'fields',
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

  goToCreate() {
    this.router.navigate(['/admin/fields/new']);
  }

  goToDetails(field: any) {
    this.router.navigate(['/admin/fields/view', field.id]);
  }

  goToEdit(field: any) {
    this.router.navigate(['/admin/fields/edit', field.id]);
  }

  removeField(field: any) {
    SweetAlert.fire({
      title: 'Etes-vous sure ?',
      icon: 'warning',
      text: `Vous allez supprimer le field [${field.label}]`,
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, je confirme',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.removeResource('fields', field.id).subscribe({
          next: () => {
            SweetAlert.fire({
              title: 'Supprimé!',
              text: `${field.name} a bien ete supprimé`,
              icon: 'success',
              didClose: () => {
                this.listFields(
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
}
