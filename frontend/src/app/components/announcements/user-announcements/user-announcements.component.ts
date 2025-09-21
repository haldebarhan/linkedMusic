import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { debounceTime, Subscription } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-announcements',
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './user-announcements.component.html',
  styleUrl: './user-announcements.component.css',
})
export class UserAnnouncementsComponent implements OnInit, OnDestroy {
  form: FormGroup;
  metadata = { total: 0, page: 1, totalPage: 1 };
  pages: number[] = [];
  loading = false;
  order = 'desc';
  sub?: Subscription;
  rows: any[] = [];
  page = 1;
  limit = 10;
  total = 0;
  totalPage = 1;

  constructor(
    private api: ApiService<any>,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      sort: [this.order],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((qp) => {
      this.page = +(qp['page'] ?? 1);
      this.limit = +(qp['limit'] ?? this.limit);
      this.order = qp['order'] ?? this.order;
      const patch: any = {};
      if ('order' in qp) patch.sort = qp['order'];
      if (Object.keys(patch).length)
        this.form.patchValue(patch, { emitEvent: false });
      this.loadAnnouncements(this.page);
    });
    this.sub = this.form.valueChanges
      .pipe(debounceTime(250))
      .subscribe(() => this.applyFilters());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadAnnouncements(page: number, limit = 20) {
    this.loading = true;
    this.api
      .getAll({
        endpoint: 'users/announcements',
        params: {
          page,
          limit,
          order: this.order,
        },
      })
      .subscribe({
        next: (res) => {
          const items = res.items.data;
          const meta = res.items.metadata;
          this.rows = items;
          this.metadata = meta;
          this.pages = this.buildPages(
            this.metadata.page,
            this.metadata.totalPage
          );
          this.loading = false;
          this.totalPage = meta.totalPage;
          this.total = meta.total;
        },
      });
  }

  applyFilters(resetPage = true) {
    if (resetPage) this.page = 1;
    this.router.navigate([], {
      queryParams: {
        page: this.page,
        limit: this.limit,
        order: this.form.value.sort || 'desc',
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  go(p: number) {
    if (p < 1 || p > this.totalPage || p === this.page) return;
    this.page = p;
    this.loadAnnouncements(p);
  }

  private buildPages(current: number, last: number) {
    const max = 7;
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
}
