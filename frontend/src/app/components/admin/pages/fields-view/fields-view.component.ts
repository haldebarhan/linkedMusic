import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '../../data/admin-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SweetAlert } from '../../../../helpers/sweet-alert';

@Component({
  selector: 'app-fields-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fields-view.component.html',
  styleUrls: ['./fields-view.component.css'],
})
export class FieldsViewComponent implements OnInit {
  fieldId!: number;
  field: any;

  // services (liste paginée)
  rows: any[] = [];
  total = 0;
  page = 1;
  limit = 10;
  totalPage = 1;
  pages: number[] = [];
  q = '';

  // sélections
  selectedIds = new Set<number>(); // set global de tous les IDs sélectionnés
  // on garde un cache pour afficher les noms en badge même si on change de page
  selectedCache = new Map<number, string>();

  // liés (déjà attachés)
  attached: { id: number; name: string }[] = [];

  constructor(
    private api: AdminApi,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((pm) => {
      this.fieldId = +(pm.get('id') || 0);
      if (!this.fieldId) {
        this.goBack();
        return;
      }
      this.loadField();
      this.reload();
    });
  }

  /* ---------- Load Field & attached ---------- */
  loadField() {
    this.api.findAdminResource('fields', this.fieldId).subscribe({
      next: (res) => {
        const response = res.data;
        this.field = res.data;
        const attached = Array.isArray(response.categoryFields)
          ? response.categoryFields
          : [];
        this.attached = attached.map((cf: any) => {
          const id = cf.category.id;
          const name = cf.category?.name ?? `#${id}`;
          return { id, name };
        });

        // préselectionner les attachés
        this.selectedIds = new Set(this.attached.map((a) => a.id));

        // alimenter le cache noms
        this.attached.forEach((a) => this.selectedCache.set(a.id, a.name));
      },
      error: (err) => console.error(err),
    });
  }

  /* ---------- ServiceTypes list (search + page) ---------- */
  reload() {
    this.api
      .listResources({
        endpoint: 'categories',
        page: this.page,
        limit: this.limit,
        params: { q: this.q || undefined },
      })
      .subscribe((res) => {
        this.rows = res.items.data;
        const meta = res.items.metadata ?? {
          total: 0,
          page: 1,
          totalPage: 1,
        };
        this.total = meta.total;
        this.page = meta.page;
        this.totalPage = meta.totalPage;
        this.pages = this.buildPages(this.page, this.totalPage);
        // met à jour le cache pour les items visibles
        this.rows.forEach((s) => this.selectedCache.set(s.id, s.name));
      });
  }

  go(p: number) {
    if (p < 1 || p > this.totalPage || p === this.page) return;
    this.page = p;
    this.reload();
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

  /* ---------- Sélection (table) ---------- */
  toggleId(id: number, ev: any) {
    if (ev?.target?.checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
  }

  pageAllSelected(): boolean {
    return (
      this.rows.length > 0 && this.rows.every((s) => this.selectedIds.has(s.id))
    );
  }

  toggleSelectPage(ev: any) {
    const check = !!ev?.target?.checked;
    this.rows.forEach((s) =>
      check ? this.selectedIds.add(s.id) : this.selectedIds.delete(s.id)
    );
  }

  unselect(id: number) {
    this.selectedIds.delete(id);
  }

  clearSelection() {
    this.selectedIds.clear();
  }

  get selectedBadges(): { id: number; name: string }[] {
    return Array.from(this.selectedIds).map((id) => ({
      id,
      name: this.selectedCache.get(id) ?? `#${id}`,
    }));
  }

  /* ---------- Link / Detach ---------- */
  link() {
    if (!this.selectedIds.size) return;
    const ids = Array.from(this.selectedIds);
    const payload = ids.map((id) => {
      return { categoryId: id, fieldId: this.fieldId };
    });
    this.api
      .createResource('attach-fields', { fields: payload })
      .subscribe(() => {
        this.loadField();
      });
  }

  detach(serviceTypeId: number) {
    SweetAlert.fire({
      title: 'Etes-vous sure ?',
      icon: 'warning',
      text: `Delier ce service ?`,
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, je confirme',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.api
          .createResource('detach-fields', {
            categoryId: serviceTypeId,
            fieldId: this.fieldId,
          })
          .subscribe({
            next: () => {
              SweetAlert.fire({
                title: 'Champ délié!',
                text: `le champ a bien ete délié`,
                icon: 'success',
                didClose: () => {
                  this.attached = this.attached.filter(
                    (a) => a.id !== serviceTypeId
                  );
                  this.selectedIds.delete(serviceTypeId);
                },
              });
            },
            error: (err) => console.error(err),
          });
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/fields']);
  }
}
