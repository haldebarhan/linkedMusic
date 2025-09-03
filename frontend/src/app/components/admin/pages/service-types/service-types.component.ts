import { Component, OnInit } from '@angular/core';
import { AdminApi } from '../../data/admin-api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SweetAlert } from '../../../../helpers/sweet-alert';

@Component({
  selector: 'app-service-types',
  imports: [CommonModule],
  templateUrl: './service-types.component.html',
  styleUrl: './service-types.component.css',
})
export class ServiceTypesComponent implements OnInit {
  rows: any[] = [];
  page = 1;
  limit = 10;
  total = 0;
  totalPage = 1;
  pages: number[] = [];

  constructor(private api: AdminApi, private router: Router) {}

  ngOnInit(): void {
    this.listServices(this.page);
  }

  listServices(page: number, limit = 10) {
    this.api
      .listResources({ endpoint: 'service-types', page, limit })
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
          this.pages = this.buildPages(this.page, this.totalPage);
        },
        error: (err) => console.error(err),
      });
  }

  go(p: number) {
    if (p < 1 || p > this.totalPage || p === this.page) return;
    this.page = p;
    this.listServices(p);
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
    this.router.navigate(['/admin/services/new']);
  }

  removeService(service: any) {
    SweetAlert.fire({
      title: 'Etes-vous sure ?',
      icon: 'warning',
      text: `Vous allez supprimer le service-type [${service.name}]`,
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, je confirme',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.removeResource('categories', service.id).subscribe({
          next: () => {
            SweetAlert.fire({
              title: 'Supprimé!',
              text: `${service.name} a bien ete supprimé`,
              icon: 'success',
              didClose: () => {
                this.listServices(this.page);
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
