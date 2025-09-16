import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-post-form',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './post-form.component.html',
  styleUrl: './post-form.component.css',
})
export class PostFormComponent implements OnInit {
  slug: string | null = null;
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
  files: File[] = [];

  perServiceType: Record<string, Field[]> = {};

  constructor(
    private readonly apiService: ApiService<any>,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder
  ) {}
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.slug = params.get('category');
      if (!this.slug) {
        this.router.navigate(['/annonces/publier']);
        return;
      }
      this.label = formatLabel(this.slug);
      this.loadSchema();
    });
  }

  loadSchema() {
    this.apiService
      .getAll({
        endpoint: `catalog/categories/${this.slug}/filters`,
      })
      .subscribe({
        next: (res: any) => {
          this.results = res.data;
          this.dynFields = this.results.fields;
          this.categoryName = this.results.category;
          this.services = this.results.services;

          this.commonFields = this.results.fields ?? [];
          this.perServiceType = {};
          this.buildForm();
        },
        error: (err) => console.error('err: ', err),
      });
  }

  buildForm() {
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

    if (this.slug === 'musiciens')
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
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const payload = this.buildPayload();
    const FormData = this.buildAnnouncementFormData(payload, this.files);
    this.apiService.create('users/announcements', FormData).subscribe({
      next: (res) => {
        if (res.statusCode === 201) {
          this.form.reset();
          Toast.fire({
            icon: 'success',
            text: 'Annonce créée et en cours de validation',
          });
        }
        this.submitting = false;
      },
      error: (err) => {
        console.log(err);
        this.submitting = false;
      },
      complete: () => (this.submitting = false),
    });
  }

  backToCategories() {
    this.router.navigate(['/annonces/publier']);
  }

  onfileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.files = Array.from(input.files || []);
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

  private buildAnnouncementFormData(
    payload: any,
    files: File[],
    fileFieldName: string = 'fichiers'
  ): FormData {
    const fd = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'object') {
        fd.append(key, JSON.stringify(value));
      } else {
        fd.append(key, String(value));
      }
    });

    files?.forEach((file) => fd.append(fileFieldName, file));
    return fd;
  }
}
