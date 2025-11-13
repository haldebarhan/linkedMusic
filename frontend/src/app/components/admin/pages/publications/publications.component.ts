import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../../shared/services/api.service';
import { CommonModule } from '@angular/common';
import { AdminApi } from '../../data/admin-api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-publications',
  imports: [CommonModule],
  templateUrl: './publications.component.html',
  styleUrl: './publications.component.css',
})
export class PublicationsComponent implements OnInit {
  rows: any[] = [];
  page = 1;
  limit = 10;
  total = 0;
  totalPage = 1;
  pages: number[] = [];

  constructor(private api: AdminApi, private router: Router) {}

  ngOnInit(): void {
    this.loadPendingPublication(this.page);
  }

  loadPendingPublication(page: number, limit = 10) {
    this.api
      .listData({
        endpoint: 'announcements',
        page,
        limit,
      })
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
    this.loadPendingPublication(p);
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

  goTodetail(id: number) {
    this.router.navigate(['/admin/publications', id]);
  }

  get start() {
    return this.total ? (this.page - 1) * this.limit + 1 : 0;
  }
  get end() {
    return (this.page - 1) * this.limit + this.rows.length;
  }
}
