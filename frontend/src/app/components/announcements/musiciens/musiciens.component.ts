import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { debounceTime, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-musiciens',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './musiciens.component.html',
  styleUrl: './musiciens.component.css',
})
export class MusiciensComponent implements OnInit {
  metadata: { total: number; page: number; totalPage: number } | null = null;
  pages: number[] = [];
  isMobile = false;
  isLoading = false;
  showBackToTop = false;
  lastScrollTop = 0;

  slug: string = 'musiciens';
  services: any[] = [];
  styles: any;
  options: any[] = [];
  form: FormGroup;
  rows: any[] = [];
  total = 0;
  page = 1;
  limit = 20;
  totalPage = 1;
  loading = false;

  private sub?: Subscription;

  constructor(
    private readonly apiService: ApiService<any>,
    private readonly fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      lookingFor: [''],
      iAm: [''],
      status: [''],
      location: [''],
      styles: [[]],
    });
  }

  ngOnInit(): void {
    this.loadResources();

    this.route.queryParams.subscribe((qp) => {
      // pagination
      this.page = +(qp['page'] ?? 1);
      this.limit = +(qp['limit'] ?? this.limit);

      // 🔧 patch partiel: on ne touche qu’aux clés présentes dans l’URL
      const patch: any = {};
      if ('lookingFor' in qp) patch.lookingFor = qp['lookingFor'];
      if ('iAm' in qp) patch.iAm = qp['iAm'];
      if ('status' in qp) patch.status = qp['status'];
      if ('location' in qp) patch.location = qp['location'];
      if ('styles' in qp) {
        const raw = qp['styles'];
        patch.styles = Array.isArray(raw)
          ? raw
          : raw
          ? String(raw).split(',')
          : [];
      }

      if (Object.keys(patch).length) {
        this.form.patchValue(patch, { emitEvent: false }); // ← ne déclenche pas applyFilters()
      }

      this.loadResults(this.page);
    });

    this.sub = this.form.valueChanges
      .pipe(debounceTime(250))
      .subscribe(() => this.applyFilters());
  }

  loadResources() {
    this.apiService
      .getAll({
        endpoint: `catalog/categories/${this.slug}/filters`,
      })
      .subscribe({
        next: (res: any) => {
          this.services = res.data.services;
          this.styles = res.data.fields.find(
            (element: any) => element.key === 'styles'
          );
          this.options = this.styles.options;
        },
        error: (err) => console.error(err),
      });
  }

  applyFilters(resetPage = true) {
    if (resetPage) this.page = 1;
    const qp = this.buildFilters();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: qp,
      replaceUrl: true,
    });
  }

  clearAll() {
    this.form.reset({
      lookingFor: '',
      iAm: '',
      status: '',
      location: '',
      styles: [],
    });
    this.applyFilters();
  }

  go(p: number) {
    if (p < 1 || p > this.totalPage || p === this.page) return;
    this.page = p;
    this.applyFilters(false);
  }

  setStatus(v: string | '') {
    this.form.get('status')?.setValue(v);
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
    const params: Record<string, any> = {
      page: this.page,
      limit: this.limit,
    };
    if (v.lookingFor) params['lookingFor'] = v.lookingFor;
    if (v.iAm) params['iAm'] = v.iAm;
    if (v.status) params['status'] = v.status;
    if (v.location) params['location'] = v.location;
    if (Array.isArray(v.styles) && v.styles.length) params['styles'] = v.styles;
    // if (v.q) params['q'] = v.q; // si tu veux brancher Meili pour la barre locale du panneau
    return params;
    // NOTE: adapte les clés ci-dessus à tes Fields/FilterBuilder (ex: iAm -> field key 'iam')
  }

  public isStyleChecked(v: string): boolean {
    const arr = this.form.get('styles')?.value;
    return Array.isArray(arr) ? arr.includes(v) : false;
  }

  public toggleStyle(v: string, checked: boolean): void {
    const ctrl = this.form.get('styles');
    if (!ctrl) return;
    const set = new Set<string>(Array.isArray(ctrl.value) ? ctrl.value : []);
    checked ? set.add(v) : set.delete(v);
    ctrl.setValue(Array.from(set));
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity({ emitEvent: true });
  }

  loadResults(page: number) {
    this.isLoading = true;
    const filters = this.buildFilters();

    this.apiService
      .listAnnouncements({ categorySlug: this.slug, filters, page })
      .subscribe({
        next: (r) => {
          const root = r.items;
          this.metadata = root.metadata ?? {
            total: root.data.length ?? 0,
            page: 1,
            totalPage: 1,
          };

          this.rows = root.data;
          this.total = this.metadata.total;
          this.page = this.metadata.page || 1;
          this.totalPage = this.metadata.totalPage || 1;
          this.pages = this.buildPages(this.page, this.totalPage);
          this.loading = false;
        },
        error: (err) => console.error(err),
      });
  }

  changePage(page: number) {
    if (this.metadata && (page < 1 || page > this.metadata.totalPage)) return;
    this.loadResults(page);
    this.scrollToTop();
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  flatStyles(styles: any) {
    if (!styles) return '';
    if (styles && Array.isArray(styles)) {
      return styles.map((s) => s).join(', ');
    }
    if (styles && typeof styles === 'string') {
      return styles.split(' | ').join(', ');
    }
    return '';
  }

  goToDetails(announcementId: number) {
    this.router.navigate(['/announcemnts/details/', announcementId]);
  }
}
