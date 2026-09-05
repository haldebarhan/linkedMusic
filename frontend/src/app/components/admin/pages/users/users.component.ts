import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../../shared/services/api.service';
import { Router } from '@angular/router';
import { Badge } from '../../../../shared/enums/badge.enum';
import { FormsModule } from '@angular/forms';
import { Status } from '../../../../shared/enums/status.enum';
import { PaginationService } from '../../../../shared/services/pagination.service';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  providers: [PaginationService]
})
export class UsersComponent implements OnInit {
  rows: any[] = [];
  page = 1;
  limit = 50;
  total = 0;
  totalPage = 1;
  pages: number[] = [];
  q = '';

  constructor(
    private api: ApiService,
    private router: Router,
    public paginationService: PaginationService,
  ) {}
  ngOnInit(): void {
    this.paginationService.init((page, limit, cursor) =>
      this.loadUsers(page, limit, cursor),
    );
    this.loadUsers(
      this.paginationService.page,
      this.paginationService.pagination.limit,
      this.paginationService.cursor,
    );
  }

  loadUsers(page: number, limit = 50, cursor?: number | string | null) {
    this.api
      .listData({
        endpoint: 'users',
        page,
        limit,
        cursor: cursor === null ? undefined : Number(cursor),
        params: { q: this.q || undefined },
      })
      .subscribe({
        next: (res) => {
          this.rows = res.items.data;
        },
        error: (err) => {
          console.log(err);
        },
      });
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

  formatStatus(status: Status) {
    const maping: Record<Status, string> = {
      [Status.ACTIVATED]: 'Actif',
      [Status.CLOSED]: 'Fermé',
      [Status.DESACTIVATED]: 'Inactif',
      [Status.REMOVED]: 'Supprimé',
      [Status.SUSPENDED]: 'Suspendu',
      [Status.UNVERIFIED]: 'Non Vérifié',
      [Status.VERIFIED]: 'Vérifié',
    };
    return maping[status] || status;
  }
}
