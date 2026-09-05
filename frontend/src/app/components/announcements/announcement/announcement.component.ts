// announcement.component.ts

import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, Subscription } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { country_list } from '../../../helpers/countries';
import { CategoryField } from '../../../shared/types/field-input-type';

@Component({
  selector: 'app-announcement',
  imports: [CommonModule, ReactiveFormsModule, TruncatePipe],
  templateUrl: './announcement.component.html',
  styleUrl: './announcement.component.css',
})
export class AnnouncementComponent implements OnInit, OnDestroy {
  slug: string = '';
  categoryName: string = '';

  sortBy: 'createdAt' | 'price' | 'views' = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Champs dynamiques
  searchFields: CategoryField[] = [];

  // Formulaire de recherche
  searchForm: FormGroup;

  // Résultats
  rows: any[] = [];
  pagination = {
    limit: 20,
    hasNext: false,
    nextCursor: null as number | null,
  };
  page = 1;
  limit = 20;
  cursor: number | null = null;
  loading = false;
  loadingSchema = false;
  infiniteLoading = false;
  query: string | null = null;

  // Pays
  countries: Array<{ name: string; code: string }> = [];

  // UI State
  showAdvancedSearch = false;
  isMobile: boolean = window.innerWidth < 768;

  private sub?: Subscription;
  private previousCursors: Array<number | null> = [];
  private appendNextLoad = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService<any>
  ) {
    // Initialiser un formulaire vide
    this.searchForm = this.fb.group({
      location: [''],
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = event.target.innerWidth < 768;
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event: any) {
    if (
      !this.isMobile ||
      this.loading ||
      this.infiniteLoading ||
      !this.pagination.hasNext
    ) {
      return;
    }

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );

    if (scrollTop + windowHeight >= documentHeight - 300) {
      this.infiniteLoading = true;
      this.goToNextPage(true);
    }
  }

  buildQueryParams() {
    this.route.queryParams.subscribe((qp) => {
      this.limit = +(qp['limit'] ?? this.limit);
      const cursor = Number(qp['cursor']);
      this.cursor = Number.isSafeInteger(cursor) && cursor > 0 ? cursor : null;
      this.query = qp['q'] ?? null;

      this.sortBy = (qp['sortBy'] as any) ?? 'createdAt';
      this.sortOrder = (qp['sortOrder'] as any) ?? 'desc';

      this.patchSearchFormFromQuery(qp);

      const append = this.appendNextLoad;
      this.appendNextLoad = false;
      this.loadResults(append);
    });
  }

  ngOnInit(): void {
    this.countries = country_list;
    this.route.paramMap.subscribe(async (pm) => {
      this.slug = pm.get('category') || '';
      await this.loadCategorySchema(this.slug);
      this.page = 1;
    });

    this.buildQueryParams();

    // Écouter les changements du formulaire
    this.sub = this.searchForm.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => this.applyFilters());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get currentSortValue(): 'date_asc' | 'date_desc' {
    return this.sortOrder === 'asc' ? 'date_asc' : 'date_desc';
  }

  /**
   * Charge le schéma de la catégorie avec les champs de recherche
   */
  private async loadCategorySchema(slug: string) {
    if (!slug) return;

    this.loadingSchema = true;

    this.api.getAll({ endpoint: `categories/${slug}` }).subscribe({
      next: (res: any) => {
        const categorySchema = res.data;
        this.categoryName = categorySchema.name;

        // Filtrer les champs visibles dans la recherche
        this.searchFields = categorySchema.categoryFields
          .filter((cf: CategoryField) => cf.visibleInFilter)
          .sort((a: CategoryField, b: CategoryField) => a.order - b.order);

        // Construire le formulaire de recherche
        this.buildSearchForm();

        this.loadingSchema = false;
      },
      error: (err) => {
        console.error('Erreur chargement schéma:', err);
        this.searchFields = [];
        this.loadingSchema = false;
      },
    });
  }

  /**
   * Construit le formulaire de recherche avec les champs dynamiques
   */
  private buildSearchForm(): void {
    const group: any = {
      location: [''],
    };

    // Ajouter tous les champs de recherche dynamiques
    this.searchFields.forEach((categoryField) => {
      this.addSearchControlForField(group, categoryField);
    });

    this.searchForm = this.fb.group(group);
    this.sub?.unsubscribe();
    this.sub = this.searchForm.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => this.applyFilters());
  }

  /**
   * Ajoute un contrôle de formulaire pour un champ de recherche
   */
  private addSearchControlForField(
    group: any,
    categoryField: CategoryField
  ): void {
    const field = categoryField.field;

    switch (field.inputType) {
      case 'TEXT':
      case 'TEXTAREA':
      case 'SELECT':
      case 'RADIO':
        group[field.key] = new FormControl('');
        break;

      case 'NUMBER':
        group[field.key] = new FormControl('');
        break;

      case 'RANGE':
        // Pour les ranges, créer deux champs (min et max)
        group[`${field.key}_min`] = new FormControl('');
        group[`${field.key}_max`] = new FormControl('');
        break;

      case 'CHECKBOX':
      case 'MULTISELECT':
        group[field.key] = new FormControl([]);
        break;

      case 'TOGGLE':
        group[field.key] = new FormControl(null);
        break;

      default:
        group[field.key] = new FormControl('');
    }
  }

  /**
   * Remplit le formulaire de recherche à partir des query params
   */
  private patchSearchFormFromQuery(qp: any): void {
    const patch: any = {};

    // Lire country et le mapper vers location
    if ('country' in qp) {
      patch.location = qp['country'] ?? '';
    }

    // Always clear dynamic fields first. Without this, navigating to a URL
    // without `fieldFilters` leaves the previous checkbox values in the form.
    this.searchFields.forEach((categoryField) => {
      const { key, inputType } = categoryField.field;
      patch[key] =
        inputType === 'CHECKBOX' || inputType === 'MULTISELECT'
          ? []
          : inputType === 'TOGGLE'
            ? null
            : '';
      if (inputType === 'RANGE') {
        patch[`${key}_min`] = '';
        patch[`${key}_max`] = '';
      }
    });

    // Lire fieldFilters et extraire les valeurs des champs
    if ('fieldFilters' in qp && qp['fieldFilters']) {
      try {
        const fieldFilters = JSON.parse(qp['fieldFilters']);

        // Pour chaque champ de recherche, récupérer sa valeur depuis fieldFilters
        this.searchFields.forEach((categoryField) => {
          const field = categoryField.field;
          const filterKey = field.key;

          if (filterKey in fieldFilters) {
            patch[filterKey] = fieldFilters[filterKey];
          }

          // Gérer les ranges
          if (field.inputType === 'RANGE') {
            if (`${filterKey}_min` in fieldFilters) {
              patch[`${filterKey}_min`] = fieldFilters[`${filterKey}_min`];
            }
            if (`${filterKey}_max` in fieldFilters) {
              patch[`${filterKey}_max`] = fieldFilters[`${filterKey}_max`];
            }
          }
        });
      } catch (e) {
        console.error('Erreur lors du parsing de fieldFilters:', e);
      }
    }

    this.searchForm.patchValue(patch, { emitEvent: false });
  }

  /**
   * Construit les filtres à partir du formulaire de recherche
   */
  private buildFilters(): Record<string, any> {
    const formValue = this.searchForm.value;
    const params: Record<string, any> = {};

    // Mapper location vers country
    if (formValue.location) {
      params['country'] = formValue.location;
    }

    // Construire fieldFilters avec les valeurs des champs dynamiques
    const fieldFilters: Record<string, any> = {};
    let hasFieldFilters = false;

    this.searchFields.forEach((categoryField) => {
      const field = categoryField.field;
      const key = field.key;
      const value = formValue[key];

      // Ignorer les valeurs vides
      if (
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        return;
      }

      hasFieldFilters = true;

      switch (field.inputType) {
        case 'TEXT':
        case 'TEXTAREA':
        case 'SELECT':
        case 'RADIO':
          fieldFilters[key] = value;
          break;

        case 'NUMBER':
          fieldFilters[key] = Number(value);
          break;

        case 'RANGE':
          const minKey = `${key}_min`;
          const maxKey = `${key}_max`;
          if (formValue[minKey]) {
            fieldFilters[minKey] = Number(formValue[minKey]);
          }
          if (formValue[maxKey]) {
            fieldFilters[maxKey] = Number(formValue[maxKey]);
          }
          break;

        case 'CHECKBOX':
        case 'MULTISELECT':
          if (Array.isArray(value) && value.length > 0) {
            fieldFilters[key] = value;
          }
          break;

        case 'TOGGLE':
          if (value !== null) {
            fieldFilters[key] = Boolean(value);
          }
          break;

        default:
          fieldFilters[key] = value;
      }
    });

    if (hasFieldFilters) {
      params['fieldFilters'] = JSON.stringify(fieldFilters);
    }

    return params;
  }

  applyFilters(resetPage = true) {
    if (resetPage) {
      this.page = 1;
      this.cursor = null;
      this.previousCursors = [];
      this.rows = [];
    }

    const filters = this.buildFilters();
    const qp: Record<string, any> = {
      // Remove the legacy offset-page parameter while keeping the cursor URL shareable.
      page: null,
      limit: this.limit,
      cursor: this.cursor,

      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
    };

    // Ajouter les filtres aux query params
    // `null` explicitly removes stale query params when the last selection is
    // cleared (queryParamsHandling: 'merge' otherwise keeps the old value).
    qp['country'] = filters['country'] ?? null;
    qp['fieldFilters'] = filters['fieldFilters'] ?? null;

    // Conserver le query de recherche s'il existe
    qp['q'] = this.query ?? null;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: qp,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  goToNextPage(append = false): void {
    if (!this.pagination.hasNext || !this.pagination.nextCursor) return;
    this.previousCursors.push(this.cursor);
    this.cursor = this.pagination.nextCursor;
    this.page++;
    this.appendNextLoad = append;
    if (!append) this.rows = [];
    this.applyFilters(false);
  }

  goToPreviousPage(): void {
    const previousCursor = this.previousCursors.pop();
    if (previousCursor === undefined) return;
    this.cursor = previousCursor;
    this.page = Math.max(1, this.page - 1);
    this.rows = [];
    this.applyFilters(false);
  }

  resetFilters() {
    this.sub?.unsubscribe();

    // Reset du formulaire
    this.searchForm.reset({ location: '' }, { emitEvent: false });
    this.showAdvancedSearch = false;
    this.page = 1;
    this.cursor = null;
    this.previousCursors = [];
    this.rows = [];
    this.query = null;

    // Reset du tri
    this.sortBy = 'createdAt';
    this.sortOrder = 'desc';

    // ⚠️ Garder seulement les query params essentiels
    this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: {
          limit: this.limit,
          cursor: null,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
        replaceUrl: true,
      })
      .then(() => {
        // Réabonner aux changements
        this.sub = this.searchForm.valueChanges
          .pipe(debounceTime(300))
          .subscribe(() => this.applyFilters());

        // Charger les résultats sans filtres
        this.loadResults();
      });
  }

  toggleAdvancedSearch() {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToDetails(announcementId: number) {
    this.router.navigate(['/announcemnts/details/', announcementId]);
  }

  onSortChange(ev: Event) {
    const v = (ev.target as HTMLSelectElement).value as
      | 'date_asc'
      | 'date_desc';
    // Ici on ne trie que par date, mais tu peux étendre pour 'price', 'views', etc.
    this.sortBy = 'createdAt';
    this.sortOrder = v === 'date_asc' ? 'asc' : 'desc';
    this.applyFilters(); // reset page à 1
  }

  private loadResults(append: boolean = false) {
    this.loading = !append;
    this.infiniteLoading = append;
    const filters = this.buildFilters();

    // Construire les query params selon AnnouncementQueryDto
    const queryParams: Record<string, any> = {
      categorySlug: this.slug,
      cursor: this.cursor,
      limit: this.limit,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
    };

    // Ajouter la recherche textuelle si présente
    if (this.query) {
      queryParams['search'] = this.query;
    }

    // Ajouter les filtres
    if (filters['country']) {
      queryParams['country'] = filters['country'];
    }
    if (filters['fieldFilters']) {
      queryParams['fieldFilters'] = filters['fieldFilters'];
    }

    this.api.searchAnnouncements(queryParams).subscribe({
      next: (r: any) => {
        const items = r.data?.data ?? r.data ?? [];
        const pagination = r.data?.pagination;

        if (append) this.rows = [...this.rows, ...items];
        else this.rows = items;

        this.pagination = {
          limit: pagination?.limit ?? this.limit,
          hasNext: Boolean(pagination?.hasNext),
          nextCursor: pagination?.nextCursor ?? null,
        };
        this.loading = false;
        this.infiniteLoading = false; // Ajout ici : Réinitialise après succès
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.infiniteLoading = false; // Ajout ici : Réinitialise après erreur
        // Optionnel : this.page--;  // Pour retry la même page au prochain scroll
      },
    });
  }

  // ============================================
  // HELPERS POUR LE TEMPLATE
  // ============================================

  /**
   * Vérifie si une valeur est dans un tableau (pour checkbox/multiselect)
   */
  isInArray(key: string, value: string): boolean {
    const ctrl = this.searchForm.get(key);
    const v = ctrl?.value;
    return Array.isArray(v) && v.includes(value);
  }

  /**
   * Gère le toggle d'une checkbox dans un multiselect
   */
  onMultiToggle(key: string, value: string, ev: Event): void {
    const checked = (ev.target as HTMLInputElement)?.checked ?? false;
    const ctrl = this.searchForm.get(key);
    if (!ctrl) return;

    const cur = Array.isArray(ctrl.value) ? [...ctrl.value] : [];
    const idx = cur.indexOf(value);

    if (checked && idx === -1) cur.push(value);
    if (!checked && idx > -1) cur.splice(idx, 1);

    ctrl.setValue(cur);
    ctrl.markAsDirty();
  }

  /**
   * Gère le changement d'état d'un toggle
   */
  onToggleChange(key: string, ev: Event): void {
    const checked = (ev.target as HTMLInputElement)?.checked ?? false;
    const ctrl = this.searchForm.get(key);
    if (!ctrl) return;

    // Pour les filtres, permettre de désélectionner
    ctrl.setValue(checked ? true : null);
  }
}
