import { Component, OnInit } from '@angular/core';
import { AdminApi } from '../../data/admin-api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SweetAlert } from '../../../../helpers/sweet-alert';
import { ApiService } from '../../../../shared/services/api.service';

@Component({
  selector: 'app-categorie-page',
  imports: [CommonModule],
  templateUrl: './categorie-page.component.html',
  styleUrl: './categorie-page.component.css',
})
export class CategoriePageComponent implements OnInit {
  rows: any[] = [];
  page = 1;
  limit = 10;
  total = 0;
  totalPage = 1;
  pages: number[] = [];
  constructor(
    private api: AdminApi,
    private router: Router,
    publicApi: ApiService<any>
  ) {}

  ngOnInit(): void {
    this.listCategories(this.page);
  }
  listCategories(page: number, limit = 10) {
    this.api.listResources({ endpoint: 'categories', page, limit }).subscribe({
      next: (res) => {
        this.rows = res.items.data;
        const meta = res.items.metadata ?? { total: 0, page: 1, totalPage: 1 };
        this.total = meta.total;
        this.totalPage = meta.totalPage;
        this.page = meta.page;
        this.pages = this.buildPages(this.page, this.totalPage);
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
                  this.listCategories(this.page);
                },
              });
            },
          });
      }
    });
  }

  go(p: number) {
    if (p < 1 || p > this.totalPage || p === this.page) return;
    this.page = p;
    this.listCategories(p);
  }

  buildPages(current: number, last: number) {
    const max = 5;
    let start = Math.max(1, current - Math.floor(max / 2));
    let end = Math.min(last, start + max - 1);
    start = Math.max(1, end - max + 1);
    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  goToCreate() {
    this.router.navigate(['/admin/categories/new']);
  }

  goToDetails(category: any) {
    this.router.navigate(['/admin/categories', category.id]);
  }

  get start() {
    return this.total ? (this.page - 1) * this.limit + 1 : 0;
  }
  get end() {
    return (this.page - 1) * this.limit + this.rows.length;
  }
}
