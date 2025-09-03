import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AdminApi } from '../../../data/admin-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FieldInputType } from '../../../../../shared/types/field-input-type';

@Component({
  selector: 'app-field-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './field-form.component.html',
  styleUrl: './field-form.component.css',
})
export class FieldFormComponent implements OnInit {
  inputTypes: FieldInputType[] = [
    'TEXT',
    'TEXTAREA',
    'NUMBER',
    'SELECT',
    'MULTISELECT',
    'RADIO',
    'CHECKBOX',
    'TOGGLE',
    'RANGE',
  ];
  submitted = false;
  form: FormGroup;
  saving = false;
  isEdit = false;
  fieldId?: number;

  constructor(
    private fb: FormBuilder,
    private api: AdminApi,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      key: ['', [Validators.required, Validators.pattern(/^[a-z0-9_-]+$/)]],
      label: ['', [Validators.required, Validators.minLength(2)]],
      inputType: <FormControl<FieldInputType>>(
        new FormControl('TEXT', { nonNullable: true })
      ),
      placeholder: [''],
      unit: [''],
      searchable: [true],
      filterable: [true],
      options: this.fb.array([] as FormGroup[]),
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.fieldId = parseInt(params.get('id') as string);
      this.isEdit = !!this.fieldId;
      if (this.fieldId && this.isEdit) {
        this.findField(this.fieldId);
      } else {
        this.form.reset({
          key: '',
          label: '',
          inputType: 'TEXT',
          placeholder: '',
          unit: '',
          searchable: true,
          filterable: true,
        });
        this.options.clear();
      }
      this.onTypeChange();
    });
  }

  // -------- helpers
  get options(): FormArray<FormGroup> {
    return this.form.get('options') as FormArray<FormGroup>;
  }
  currentType(): FieldInputType {
    return this.form.controls['inputType'].value as FieldInputType;
  }
  acceptsOptions(): boolean {
    const t = this.currentType();
    return (
      t === 'SELECT' || t === 'MULTISELECT' || t === 'RADIO' || t === 'CHECKBOX'
    );
  }
  showPlaceholder(): boolean {
    const t = this.currentType();
    return t === 'TEXT' || t === 'TEXTAREA' || t === 'NUMBER';
  }
  showUnit(): boolean {
    const t = this.currentType();
    return t === 'NUMBER' || t === 'RANGE';
  }

  onTypeChange() {
    // rien de spécial: on masque/affiche le bloc options
  }
  // -------- options
  addOption() {
    const idx = this.options.length + 1;
    const g = this.fb.group({
      label: ['', Validators.required],
      value: [''], // readonly, alimenté par setOptionValue
      order: [idx, [Validators.min(0)]],
    });
    this.options.push(g);
    this.setOptionValue(this.options.length - 1);
  }
  removeOption(i: number) {
    this.options.removeAt(i);
  }
  setOptionValue(i: number) {
    const g = this.options.at(i) as FormGroup;
    const label = (g.get('label')?.value ?? '').toString();
    g.get('value')?.setValue(label.trim().toLowerCase(), { emitEvent: false });
  }

  optionsRequiredInvalid(): boolean {
    return this.acceptsOptions() && this.options.length === 0;
  }
  canSubmit(): boolean {
    if (this.form.invalid) return false;
    if (this.optionsRequiredInvalid()) return false;
    return true;
  }

  // -------- save (create/update)
  save() {
    this.submitted = true;
    if (!this.canSubmit()) return;

    const v = this.form.value as any;
    const payload = {
      key: (v.key ?? '').trim(),
      label: (v.label ?? '').trim(),
      inputType: v.inputType,
      placeholder: v.placeholder || null,
      unit: v.unit || null,
      searchable: !!v.searchable,
      filterable: !!v.filterable,
      options: this.acceptsOptions()
        ? (v.options || []).map((o: any, i: number) => ({
            label: (o.label ?? '').trim(),
            value: (o.label ?? '').trim().toLowerCase(),
            order: Number(o.order) || i + 1,
          }))
        : [],
    };
    this.saving = true;
    const req$ = this.fieldId
      ? this.api.updateResource('fields', this.fieldId, payload)
      : this.api.createResource('fields', payload);

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/admin/fields']); // cible ta page de liste
      },
      error: (e) => {
        console.error(e);
        this.saving = false;
      },
    });
  }

  findField(id: number) {
    this.api.findAdminResource('fields', id).subscribe({
      next: (res) => {
        const field = res.data;
        this.form.patchValue({
          key: field.key,
          label: field.label,
          inputType: field.inputType,
          placeholder: field.placeholder ?? '',
          unit: field.unit ?? '',
          searchable: !!field.searchable,
          filterable: !!field.filterable,
        });
        this.options.clear();
        if (
          field.options &&
          Array.isArray(field.options) &&
          field.options.length
        ) {
          field.options
            .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
            .forEach((o: any) => {
              const g = this.fb.group({
                label: [o.label ?? '', Validators.required],
                value: [(o.label ?? '').toString().trim().toLowerCase()], // valeur imposée = lowercase(label)
                order: [o.order ?? 0, [Validators.min(0)]],
              });
              this.options.push(g);
            });
        }
        this.onTypeChange();
      },
    });
  }

  goBack() {
    this.router.navigate(['/admin/fields']);
  }
}
