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
import { Toast } from '../../../../../helpers/sweet-alert';
import { setupKeyGeneration } from '../../../../../helpers/setup-key-generation';

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
  optionsToRemove: any[] = [];
  // Stockage des options initiales pour comparaison
  private originalOptions: Map<number, any> = new Map();
  private nextTempId = -1; // ID temporaire pour les nouvelles options

  constructor(
    private fb: FormBuilder,
    private api: AdminApi,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      key: [{ value: '', disabled: true }, [Validators.required]],
      label: ['', [Validators.required, Validators.minLength(2)]],
      inputType: <FormControl<FieldInputType>>(
        new FormControl('TEXT', { nonNullable: true })
      ),
      placeholder: [''],
      unit: [''],
      searchable: [true],
      filterable: [true],
      sortable: [true],
      options: this.fb.array([] as FormGroup[]),
    });
    setupKeyGeneration(this.form, 'label', 'key');
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
          sortable: true,
        });
        this.options.clear();
        this.originalOptions.clear();
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
      id: [this.nextTempId--], // ID temporaire négatif pour les nouvelles options
      label: ['', Validators.required],
      value: [''], // readonly, alimenté par setOptionValue
      order: [idx, [Validators.min(0)]],
    });
    this.options.push(g);
    this.setOptionValue(this.options.length - 1);
  }
  removeOption(i: number) {
    const o = this.options.at(i) as FormGroup;
    const optionId = o.value.id;

    // Si l'option avait un ID positif (donc existait en base), on la garde pour suppression
    if (optionId && optionId > 0) {
      const payload = {
        id: optionId,
        label: (o.value.label ?? '').trim(),
        value: (o.value.label ?? '').trim().toLowerCase(),
        order: Number(o.value.order) || i + 1,
      };
      this.optionsToRemove.push(payload);
    }
    // Si ID négatif, c'est une nouvelle option pas encore sauvegardée, on la supprime juste
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

  // Vérifie si une option a été modifiée
  private isOptionModified(option: any): boolean {
    const id = option.id;

    // Si l'ID est négatif, c'est une nouvelle option
    if (id < 0) return true;

    // Si l'option n'existe pas dans les originales, c'est une nouvelle option
    if (!this.originalOptions.has(id)) return true;

    const original = this.originalOptions.get(id);
    const currentLabel = (option.label ?? '').trim();
    const currentOrder = Number(option.order);
    const originalLabel = (original.label ?? '').trim();
    const originalOrder = Number(original.order);

    // Compare les valeurs
    return currentLabel !== originalLabel || currentOrder !== originalOrder;
  }

  // -------- save (create/update)
  save() {
    this.submitted = true;
    if (!this.canSubmit()) return;

    const v = this.form.value as any;
    const payload: any = {
      key: (v.key ?? '').trim(),
      label: (v.label ?? '').trim(),
      inputType: v.inputType,
      placeholder: v.placeholder || null,
      unit: v.unit || null,
      searchable: !!v.searchable,
      filterable: !!v.filterable,
    };

    // Gestion des options
    if (this.acceptsOptions()) {
      const modifiedOrNewOptions = (v.options || [])
        .map((o: any, i: number) => ({
          id: o.id > 0 ? o.id : undefined, // On n'envoie pas les IDs temporaires négatifs
          label: (o.label ?? '').trim(),
          value: (o.label ?? '').trim().toLowerCase(),
          order: Number(o.order) || i + 1,
        }))
        .filter((o: any) => this.isOptionModified(o));

      // N'ajouter les options que s'il y en a à modifier/créer
      if (modifiedOrNewOptions.length > 0) {
        payload.options = modifiedOrNewOptions;
      }
    }

    // N'ajouter optionsToRemove que s'il y en a
    if (this.optionsToRemove.length > 0) {
      payload.optionsToRemove = this.optionsToRemove;
    }

    this.saving = true;
    const req$ = this.fieldId
      ? this.api.updateResource('fields', this.fieldId, payload)
      : this.api.createResource('fields', payload);

    req$.subscribe({
      next: () => {
        Toast.fire({
          icon: 'success',
          title: this.isEdit ? 'Modifié' : 'Enregistré',
          didClose: () => {
            this.saving = false;
            this.router.navigate(['/admin/fields']);
          },
        });
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
        this.originalOptions.clear();

        if (
          field.options &&
          Array.isArray(field.options) &&
          field.options.length
        ) {
          field.options
            .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
            .forEach((o: any) => {
              const optionId = o.id || 0;

              // Stocker l'option originale pour comparaison
              this.originalOptions.set(optionId, {
                id: optionId,
                label: o.label ?? '',
                value: (o.label ?? '').toString().trim().toLowerCase(),
                order: o.order ?? 0,
              });

              const g = this.fb.group({
                id: [optionId], // Inclure l'ID de l'option
                label: [o.label ?? '', Validators.required],
                value: [(o.label ?? '').toString().trim().toLowerCase()],
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
