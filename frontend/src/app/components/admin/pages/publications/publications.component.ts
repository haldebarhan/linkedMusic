import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../shared/services/api.service';
import { Router } from '@angular/router';
import { PaginationService } from '../../../../shared/services/pagination.service';

@Component({
  selector: 'app-publications',
  imports: [CommonModule],
  templateUrl: './publications.component.html',
  styleUrl: './publications.component.css',
  providers: [PaginationService],
})
export class PublicationsComponent implements OnInit {
  rows: any[] = [];
  pages: number[] = [];

  constructor(
    private api: ApiService,
    private router: Router,
    public paginationService: PaginationService,
  ) {}

  ngOnInit(): void {
    this.paginationService.init((page, limit, cursor) =>
      this.loadPendingPublication(page, limit, cursor),
    );
  }

  loadPendingPublication(
    page: number,
    limit = 10,
    cursor?: number | string | null,
  ) {
    this.api
      .listData({
        endpoint: 'announcements',
        page,
        limit,
        cursor: cursor == null ? undefined : Number(cursor),
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

  goTodetail(id: number) {
    this.router.navigate(['/admin/publications', id]);
  }
}
