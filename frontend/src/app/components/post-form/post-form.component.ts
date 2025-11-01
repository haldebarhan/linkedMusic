import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  Category,
  Field,
  FieldInputType,
} from '../../shared/types/field-input-type';
import { formatLabel } from '../../helpers/input-label';
import { Toast } from '../../helpers/sweet-alert';
import { MediaGalleryComponent } from '../../shared/components/media-gallery/media-gallery.component';
import {
  baseName,
  guessKind,
  guessMime,
  kindFromMimeOrName,
  stableIdFromUrl,
} from '../../helpers/path-part';
import { country_list } from '../../helpers/countries';

type PreviewItem = {
  url: string;
  id: string;
  name?: string;
  mime?: string;
  kind?: 'image' | 'audio' | 'video';
  /** révoquer l’objectURL quand on nettoie */
  __revoke__?: () => void;
};

@Component({
  selector: 'app-post-form',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MediaGalleryComponent,
  ],
  templateUrl: './post-form.component.html',
  styleUrl: './post-form.component.css',
})
export class PostFormComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  existingFiles: PreviewItem[] = [];
  previewFiles: PreviewItem[] = [];
  slug: string | null = null;
  files: File[] = [];
  categorySlug: string | null = null;
  announcement: any;
  announcementId: number | null = null;
  services: any[] = [];
  dynFields: any[] = [];
  commonFields: Field[] = [];
  categoryName: string = '';
  results: Category = {
    id: 0,
    categorySlug: '',
    category: '',
    services: [],
    fields: [],
  };

  submitting = false;
  form!: FormGroup;
  loadingServices = false;
  label: string = '';
  perServiceType: Record<string, Field[]> = {};
  private fileUrls: PreviewItem[] = [];

  private removedExisting = new Set<string>();
  private objectUrlToFile = new Map<string, File>();
  countries: Array<{ name: string; code: string }> = [];

  constructor(
    private readonly apiService: ApiService<any>,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder
  ) {}
  ngOnInit(): void {
    this.countries = country_list;
    const idParam = this.route.snapshot.paramMap.get('id');
    this.announcementId = idParam !== null ? +idParam : null;
    this.slug = this.route.snapshot.paramMap.get('category');
    if (!this.slug && !this.announcementId) {
      this.router.navigate(['/annonces/publier']);
    }
    if (this.slug) {
      this.categorySlug = this.slug;
      this.label = formatLabel(this.slug);
      this.loadSchema(this.slug);
    }
    if (this.announcementId) {
      this.loadAnnouncement(this.announcementId);
    }
  }
  ngOnDestroy(): void {
    this.clearNewFileUrls();
  }

  loadAnnouncement(id: number) {
    this.apiService.getOne('users/announcements', id).subscribe({
      next: (res) => {
        this.announcement = res.data;
        const slug = Array.isArray(this.announcement.category)
          ? String(this.announcement.category[0]).toLowerCase()
          : String(this.announcement.category).toLowerCase();
        this.categorySlug = slug;
        this.label = formatLabel(slug);
        this.loadSchema(slug);
      },
    });
  }

  patchForm() {
    if (!this.announcement) return;
    const ann = this.announcement;
    const [city = '', country = ''] = String(ann.location || '').split(' ');
    const tag = String(ann.tag || '').split(' ') ?? null;
    const serviceType = this.services.find(
      (s) => s.name === ann.serviceType
    )?.id;
    if (tag && tag[2]) {
      const sst = this.services.find((s) => s.name === tag[2])?.id;
      if (sst) this.form.get('searchServiceType')?.setValue(sst);
    }

    const styles: string[] | null = Array.isArray(ann.styles)
      ? ann.styles
      : null;
    if (styles?.length) this.form.get('styles')?.setValue(styles);

    this.hydrateExistingFiles(ann.fichiers);
    this.form.patchValue({
      title: ann.title,
      description: ann.description,
      city,
      country,
      serviceType,
    });
  }

  loadSchema(slug: string) {
    this.apiService
      .getAll({
        endpoint: `catalog/categories/${slug}/filters`,
      })
      .subscribe({
        next: (res: any) => {
          this.results = res.data;
          this.dynFields = this.results.fields;
          this.categoryName = this.results.category;
          this.services = this.results.services;

          this.commonFields = this.results.fields ?? [];
          this.perServiceType = {};
          this.buildForm(slug);
        },
        error: (err) => console.error('err: ', err),
      });
  }

  buildForm(slug: string) {
    const group = {
      serviceType: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      country: [''],
      city: [''],
      price: [''],
      photos: [[] as string[]],
    };
    this.commonFields.forEach((field) => this.addControlForField(group, field));
    this.form = this.fb.group(group);

    if (slug === 'musiciens')
      this.form.addControl(
        'searchServiceType',
        new FormControl('', [Validators.required])
      );

    this.applyServiceType(this.form.get('serviceType')!.value);
    const ctrl = this.form.get('serviceType')!;
    ctrl.disable({ emitEvent: false });
    if (this.services.length === 1) {
      ctrl.setValue(this.services[0].id, { emitEvent: false });
    }
    ctrl.enable({ emitEvent: false });

    if (this.announcement) {
      this.patchForm();
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const payload = this.buildPayload();
    const FormData = this.announcementId
      ? this.buildUpdateFormData(payload)
      : this.buildCreateFormData(payload);

    const endpoint = 'users/announcements';

    const obs = this.announcementId
      ? this.apiService.update(endpoint, this.announcementId, FormData)
      : this.apiService.create(endpoint, FormData);

    obs.subscribe({
      next: () => {
        this.form.reset();
        this.fileInput?.nativeElement &&
          (this.fileInput.nativeElement.value = '');
        this.files = [];
        this.clearNewFileUrls();
        this.removedExisting.clear();
        this.previewFiles = [];
        Toast.fire({
          icon: 'success',
          text: this.announcementId ? 'Annonce mise à jour' : 'Annonce créée',
          didClose: () => this.router.navigate(['/profile/announcements']),
        });
      },
      error: (err) => console.error(err),
      complete: () => (this.submitting = false),
    });
  }

  backToCategories() {
    this.router.navigate(['/annonces/publier']);
  }

  onfileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const list = Array.from(input.files || []);
    this.files = list;

    this.clearNewFileUrls();
    this.objectUrlToFile.clear();

    this.fileUrls = list.map((f) => {
      const url = URL.createObjectURL(f);
      this.objectUrlToFile.set(url, f);

      const kind = kindFromMimeOrName(f.type, f.name);
      return {
        url,
        id: url,
        name: f.name,
        mime: f.type || guessMime(f.name),
        kind:
          kind === 'image' || kind === 'audio' || kind === 'video'
            ? kind
            : undefined,
        __revoke__: () => URL.revokeObjectURL(url),
      };
    });
    this.recomputePreview();
    this.syncNativeFileInput();
  }

  hydrateExistingFiles(urls: string[]) {
    this.existingFiles = (Array.isArray(urls) ? urls : [])
      .filter((u) => !!u)
      .map((u) => {
        const id = stableIdFromUrl(u);
        const kind = guessKind(u);
        return {
          url: u,
          id,
          name: baseName(u),
          key: id,
          mime: guessMime(u),
          kind:
            kind === 'image' || kind === 'audio' || kind === 'video'
              ? kind
              : undefined,
        };
      });
    this.recomputePreview();
  }

  /** Supprime un fichier de la preview.
   *  - si c’est un existant: on le retire de existingFiles + on l’ajoute à removedExisting
   *  - si c’est un nouveau: on révoque l’objectURL, on le retire de fileUrls + this.files
   */
  onRemovePreview = (val: string) => {
    // 1) existant ?
    const exIdx = this.existingFiles.findIndex(
      (f: any) => f.id === val || f.url === val || f.key === val
    );
    if (exIdx > -1) {
      const ex = this.existingFiles[exIdx];
      this.existingFiles.splice(exIdx, 1);
      this.removedExisting.add(ex.id);
      this.recomputePreview();
      return;
    }

    const nuIdx = this.fileUrls.findIndex(
      (f: any) => f.id === val || f.url === val || f.key === val
    );
    if (nuIdx > -1) {
      const item = this.fileUrls[nuIdx];
      item.__revoke__?.();
      this.fileUrls.splice(nuIdx, 1);

      // enlève aussi le File correspondant et met à jour l'input
      const file = this.objectUrlToFile.get(item.url);
      if (file) {
        this.files = this.files.filter((f) => f !== file);
        this.objectUrlToFile.delete(item.url);
        this.syncNativeFileInput?.(); // si tu as déjà cette méthode
      }
      this.recomputePreview();
    }
  };

  private clearNewFileUrls() {
    this.fileUrls.forEach((p) => p.__revoke__?.());
    this.fileUrls = [];
  }

  private buildPayload() {
    const v = this.form.value as any;

    const dyn: Record<string, any> = {};

    this.buildDynamicKeyBySlug(this.slug!, v, dyn);
    this.dynFields.forEach((f) => {
      switch (f.inputType) {
        case 'RANGE':
          if (v[`${f.key}_min`] !== '') dyn[`${f.key}_min`] = v[`${f.key}_min`];
          if (v[`${f.key}_max`] !== '') dyn[`${f.key}_max`] = v[`${f.key}_max`];
          break;
        default:
          dyn[f.key] = v[f.key];
      }
    });

    return {
      title: v.title,
      categoryId: this.results.id,
      description: v.description,
      serviceTypeId: this.findServiceById(parseInt(v.serviceType as string)).id,
      price: v.price ? Number(v.price) : undefined,
      location: `${v.city} ${v.country}`,
      values: dyn,
    };
  }

  private findServiceById(id: number) {
    return this.services.find((service) => service.id === id);
  }

  private addControlForField(group: any, f: any) {
    const req = f.required ? [Validators.required] : [];
    switch (f.type as FieldInputType) {
      case 'TEXT':
      case 'TEXTAREA':
      case 'SELECT':
      case 'RADIO':
        group[f.key] = new FormControl('', req);
        break;
      case 'NUMBER':
        group[f.key] = new FormControl('', req);
        break;
      case 'RANGE':
        group[`${f.key}_min`] = new FormControl('');
        group[`${f.key}_max`] = new FormControl('');
        break;
      case 'CHECKBOX':
      case 'MULTISELECT':
        group[f.key] = new FormControl([]);
        break;
      case 'TOGGLE':
        group[f.key] = new FormControl(false);
        break;
    }
  }

  get serviceTypeCtrl(): FormControl {
    return this.form.get('serviceType') as FormControl;
  }

  isInArray(key: string, value: string): boolean {
    const ctrl = this.form.get(key);
    const v = ctrl?.value;
    return Array.isArray(v) && v.includes(value);
  }

  onMultiToggle(key: string, value: string, ev: Event): void {
    const checked = (ev.target as HTMLInputElement)?.checked ?? false;
    const ctrl = this.form.get(key);
    if (!ctrl) return;

    const cur = Array.isArray(ctrl.value) ? [...ctrl.value] : [];
    const idx = cur.indexOf(value);

    if (checked && idx === -1) cur.push(value);
    if (!checked && idx > -1) cur.splice(idx, 1);

    ctrl.setValue(cur);
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity({ onlySelf: true });
  }

  onToggleChange(key: string, ev: Event): void {
    const checked = (ev.target as HTMLInputElement)?.checked ?? false;
    this.form.get(key)?.setValue(checked);
  }

  private recomputePreview() {
    const merged = [...(this.existingFiles || []), ...(this.fileUrls || [])];
    const map = new Map<string, PreviewItem>();
    for (const f of merged) {
      map.set(f.id, f);
    }
    this.previewFiles = Array.from(map.values());
  }

  private applyServiceType(val: string) {
    if (this.dynFields.length) {
      this.dynFields.forEach((f) => {
        if (this.commonFields.find((c) => c.key === f.key)) return;
        if (this.form.contains(f.key)) this.form.removeControl(f.key);
        if (this.form.contains(`${f.key}_min`))
          this.form.removeControl(`${f.key}_min`);
        if (this.form.contains(`${f.key}_max`))
          this.form.removeControl(`${f.key}_max`);
      });
    }

    const key = String(val ?? '');
    const specBySlug = this.perServiceType[key];
    const specById =
      this.perServiceType[
        String(this.services.find((s) => s.slug === key)?.id ?? '')
      ];

    const specifics: Field[] = specBySlug ?? specById ?? [];

    specifics.forEach((f) => {
      if (!this.form.contains(f.key) && !this.form.contains(`${f.key}_min`)) {
        this.addControlForField(this.form, f);
      }
    });

    this.dynFields = [...this.commonFields, ...specifics];
  }

  private buildDynamicKeyBySlug(
    slug: string,
    formValues: any,
    dyn: Record<string, any>
  ) {
    switch (slug) {
      case 'musiciens':
        const iam = this.findServiceById(
          parseInt(formValues.serviceType as string)
        ).slug;
        const ilooking = this.findServiceById(
          parseInt(formValues.searchServiceType as string)
        ).slug;
        dyn['tag'] = `${iam} cherche ${ilooking}`;
    }
  }

  private buildCreateFormData(payload: any): FormData {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    });
    for (const f of this.files) fd.append('fichiers', f);
    return fd;
  }

  private buildUpdateFormData(payload: any): FormData {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    });

    for (const f of this.files) fd.append('fichiers', f);

    if (this.removedExisting.size) {
      fd.append(
        'removedFiles',
        JSON.stringify(Array.from(this.removedExisting))
      );
    }
    return fd;
  }

  private syncNativeFileInput() {
    if (!this.fileInput) return;
    const dt = new DataTransfer();
    for (const f of this.files) dt.items.add(f);
    this.fileInput.nativeElement.files = dt.files;
  }
}
