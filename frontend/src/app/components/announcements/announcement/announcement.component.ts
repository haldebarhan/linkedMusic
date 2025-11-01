import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, Subscription } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { country_list } from '../../../helpers/countries';

interface ServiceTypeDto {
  id: number;
  name: string;
  slug: string;
}

@Component({
  selector: 'app-announcement',
  imports: [CommonModule, ReactiveFormsModule, TruncatePipe],
  templateUrl: './announcement.component.html',
  styleUrl: './announcement.component.css',
})
export class AnnouncementComponent implements OnInit, OnDestroy {
  slug: string = '';
  services: ServiceTypeDto[] = [];
  servicesColumns: ServiceTypeDto[][] = [];
  form: FormGroup;
  rows: any[] = [];
  metadata: { total: number; page: number; totalPage: number } = {
    total: 0,
    page: 1,
    totalPage: 1,
  };
  pages: number[] = [];
  page = 1;
  limit = 20;
  loading = false;
  query: string | null = null;
  countries: Array<{ name: string; code: string }> = [];

  private sub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService<any>
  ) {
    this.form = this.fb.group({
      serviceTypeId: [null as number | null],
      location: [''],
    });
  }

  ngOnInit(): void {
    this.countries = country_list;
    this.route.paramMap.subscribe(async (pm) => {
      this.slug = pm.get('category') || '';
      await this.loadServicesOfCategory(this.slug);
      this.page = 1;
    });

    this.route.queryParams.subscribe((qp) => {
      this.page = +(qp['page'] ?? 1);
      this.limit = +(qp['limit'] ?? this.limit);
      this.query = qp['q'] ?? null;

      const patch: any = {};
      if ('serviceTypeId' in qp)
        patch.serviceTypeId = qp['serviceTypeId'] ? +qp['serviceTypeId'] : null;
      if ('location' in qp) patch.location = qp['location'] ?? '';

      if (Object.keys(patch).length) {
        this.form.patchValue(patch, { emitEvent: false });
      }

      this.loadResults();
    });

    this.sub = this.form.valueChanges
      .pipe(debounceTime(250))
      .subscribe(() => this.applyFilters());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  applyFilters(resetPage = true) {
    if (resetPage) this.page = 1;
    const qp = {
      ...this.buildFilters(),
      page: this.page,
      limit: this.limit,
    };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: qp,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  changePage(p: number) {
    if (p < 1 || p > this.metadata.totalPage || p === this.metadata.page)
      return;
    this.page = p;
    this.applyFilters(false);
  }

  toggleService(id: number) {
    const ctrl = this.form.get('serviceTypeId')!;
    const current = ctrl.value as number | null;
    ctrl.setValue(current === id ? null : id);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getTheme(slug: string) {
    let theme: string = '';
    switch (slug) {
      case 'musiciens':
        theme = 'music';
        break;
      case 'instruments':
        theme = 'Instruments de musique';
        break;
      case 'cours':
        theme = 'Cours de musique';
        break;
      case 'professionnels':
        theme = 'Professionnels de la musique';
        break;
      case 'studios':
        theme = 'Studios';
        break;
      case 'divers':
      default:
        theme = 'Autres rubriques de musique';
        break;
    }
    return theme;
  }

  goToDetails(announcementId: number) {
    this.router.navigate(['/announcemnts/details/', announcementId]);
  }

  private async loadServicesOfCategory(slug: string) {
    if (!slug) return;
    this.loading = true;
    this.api
      .getAll({ endpoint: `catalog/categories/${slug}/filters` })
      .subscribe({
        next: (res: any) => {
          this.services = res.data.services;
          this.makeServiceColumns(this.services, 4);
          this.loading = false;
        },
        error: () => {
          this.services = [];
          this.servicesColumns = [];
          this.loading = false;
        },
      });
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

  private buildFilters(): Record<string, any> {
    const v = this.form.value as any;
    const id = v.serviceTypeId ?? null;
    const serviceType = id ? this.services.find((s) => s.id === id) : null;
    return {
      serviceType: serviceType?.name,
      location: v.location || null,
    };
  }

  private loadResults() {
    this.loading = true;
    const filters = this.buildFilters();
    filters['q'] = this.query || null;

    this.api
      .listAnnouncements({
        categorySlug: this.slug,
        filters,
        page: this.page,
        limit: this.limit,
      })
      .subscribe({
        next: (r) => {
          const root = r.items;
          const items = root.data ?? [];
          const meta = root?.metadata ?? {
            total: items.length,
            page: 1,
            totalPage: 1,
          };

          this.rows = items;
          this.metadata = {
            total: +meta.total || items.length,
            page: +meta.page || 1,
            totalPage: +meta.totalPage || 1,
          };
          this.pages = this.buildPages(
            this.metadata.page,
            this.metadata.totalPage
          );
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        },
      });
  }

  private makeServiceColumns(rows: ServiceTypeDto[], size = 4) {
    const cols: ServiceTypeDto[][] = [];
    for (let i = 0; i < rows.length; i += size) {
      cols.push(rows.slice(i, i + size));
    }
    this.servicesColumns = cols;
  }
}
