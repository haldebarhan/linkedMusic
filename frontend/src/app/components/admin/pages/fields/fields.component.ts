import { Component, OnInit } from '@angular/core';
import { SweetAlert } from '../../../../helpers/sweet-alert';
import { AdminApi } from '../../data/admin-api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fields',
  imports: [CommonModule],
  templateUrl: './fields.component.html',
  styleUrl: './fields.component.css',
})
export class FieldsComponent implements OnInit {
  rows: any[] = [];
  page = 1;
  limit = 10;
  total = 0;
  totalPage = 1;
  pages: number[] = [];

  constructor(private api: AdminApi, private router: Router) {}

  ngOnInit(): void {
    this.listFields(this.page);
  }

  listFields(page: number, limit = 10) {
    this.api.listAdminResources({ endpoint: 'fields', page, limit }).subscribe({
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

  go(p: number) {
    if (p < 1 || p > this.totalPage || p === this.page) return;
    this.page = p;
    this.listFields(p);
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
    this.router.navigate(['/admin/fields/new']);
  }

  goToDetails(field: any) {
    this.router.navigate(['/admin/fields/view', field.id]);
  }

  removeField(field: any) {
    SweetAlert.fire({
      title: 'Etes-vous sure ?',
      icon: 'warning',
      text: `Vous allez supprimer le field [${field.name}]`,
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
                this.listFields(this.page);
              },
            });
          },
        });
      }
    });
  }

  get start() {
    return this.total ? (this.page - 1) * this.limit + 1 : 0;
  }
  get end() {
    return (this.page - 1) * this.limit + this.rows.length;
  }
}
