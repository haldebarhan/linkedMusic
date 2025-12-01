import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AdminApi } from '../../data/admin-api.service';
import { Router } from '@angular/router';
import { Badge } from '../../../../shared/enums/badge.enum';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  rows: any[] = [];
  page = 1;
  limit = 50;
  total = 0;
  totalPage = 1;
  pages: number[] = [];
  q = '';

  constructor(private api: AdminApi, private router: Router) {}
  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.api
      .listData({
        endpoint: 'users',
        page: this.page,
        limit: this.limit,
        params: { q: this.q || undefined },
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
        error: (err) => {
          console.log(err);
        },
      });
  }

  go(p: number) {
    if (p < 1 || p > this.totalPage || p === this.page) return;
    this.page = p;
    this.loadUsers();
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

  get start() {
    return this.total ? (this.page - 1) * this.limit + 1 : 0;
  }
  get end() {
    return (this.page - 1) * this.limit + this.rows.length;
  }

  goTodetail(id: number) {
    this.router.navigate(['/admin/users/details', id]);
  }

  formatBadge(badge: Badge): string {
    const maping: Record<Badge, string> = {
      [Badge.STANDARD]: 'Actif',
      [Badge.BRONZE]: 'Bronze',
      [Badge.SILVER]: 'Argent',
      [Badge.GOLD]: 'OR',
      [Badge.VIP]: 'VIP',
      [Badge.VVIP]: 'VVIP',
    };
    return maping[badge] || badge;
  }
}
