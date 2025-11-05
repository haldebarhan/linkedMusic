import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { AdminApi } from '../../../data/admin-api.service';
import { Toast } from '../../../../../helpers/sweet-alert';

enum Period {
  FREE = 'FREE',
  MONTHLY = 'MONTHLY',
  BIMONTHLY = 'BIMONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUAL = 'SEMIANNUAL',
  ANNUAL = 'ANNUAL',
}

interface Plan {
  id?: string;
  name: string;
  period: Period;
  priceCents?: number;
  parentId?: string;
  status: boolean;
  benefits: { id?: number; label: string }[];
}

@Component({
  selector: 'app-subscription-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './subscription-form.component.html',
  styleUrl: './subscription-form.component.css',
})
export class SubscriptionFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  submitted = false;
  saving = false;
  planId?: number;

  periods = Object.values(Period);
  availablePacks: Plan[] = [];
  benefitsToRemove: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private api: AdminApi,
    private location: Location
  ) {}
  ngOnInit(): void {
    this.planId = parseInt(this.route.snapshot.params['id'] as string);
    this.isEdit = !!this.planId;
    this.initForm();
    this.loadAvailablePlans();
    if (this.isEdit) {
      this.loadPlan();
    }
  }

  get benefits(): FormArray {
    return this.form.get('benefits') as FormArray;
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      period: [Period.FREE, Validators.required],
      priceCents: [null],
      parentId: [null],
      active: [true],
      benefits: this.fb.array([]),
    });

    this.form.get('period')?.valueChanges.subscribe((period) => {
      this.updatePriceValidation(period);
    });
  }

  updatePriceValidation(period: Period): void {
    const priceControl = this.form.get('priceCents');

    if (period !== Period.FREE) {
      priceControl?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      priceControl?.clearValidators();
      priceControl?.setValue(null);
    }

    priceControl?.updateValueAndValidity();
  }

  loadAvailablePlans() {
    this.api.listData({ endpoint: 'subscription-plans' }).subscribe({
      next: (res) => {
        this.availablePacks = res.items.data;
      },
    });
  }

  loadPlan() {
    if (!this.planId) return;
    this.api.findData('subscription-plans', this.planId).subscribe({
      next: (response) => {
        const plan = response.data;
        this.populateForm(plan);
      },
    });
  }

  populateForm(plan: Plan) {
    this.form.patchValue({
      name: plan.name,
      period: plan.period,
      priceCents: plan.priceCents,
      parentId: plan.parentId,
      active: plan.status,
    });

    plan.benefits.forEach((benefit: any) => {
      this.addBenefit(benefit.label, benefit.id);
    });
  }

  addBenefit(label: string = '', benefitId?: number): void {
    const benefitGroup = this.fb.group({
      id: [benefitId || null],
      label: [
        { value: label, disabled: !!benefitId },
        [Validators.required, Validators.minLength(2)],
      ],
    });

    this.benefits.push(benefitGroup);
  }

  removeBenefit(index: number): void {
    const benefit = this.benefits.at(index);
    const benefitId = benefit.get('id')?.value;
    if (benefitId) {
      this.benefitsToRemove.push(benefitId);
    }
    this.benefits.removeAt(index);
  }

  isPricingRequired(): boolean {
    return this.form.get('period')?.value !== Period.FREE;
  }

  getPriceInEuros(): string {
    const cents = this.form.get('priceCents')?.value;
    return cents;
  }

  onPriceEurosChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const euros = parseFloat(input.value) || 0;
    this.form.patchValue({ priceCents: euros });
  }

  canSubmit(): boolean {
    return this.form.valid && this.benefits.length > 0;
  }

  save() {
    this.submitted = true;
    if (!this.canSubmit()) {
      return;
    }
    this.saving = true;
    const payload = this.preparePayload();
    const request$ = this.planId
      ? this.api.updateData('subscription-plans', this.planId, payload)
      : this.api.postData('subscription-plans', payload);

    request$.subscribe({
      next: () => {
        Toast.fire({
          title: this.isEdit ? 'Pack Modifié' : 'Pack Enregistré',
          icon: 'success',
          didClose: () => {
            this.form.reset();
            this.goBack();
          },
        });
      },
      error: (error) => console.error(error),
    });
  }

  preparePayload(): any {
    const formValue = this.form.value;

    const payload: any = {
      name: formValue.name,
      period: formValue.period,
      active: formValue.active,
      benefits: this.isEdit
        ? this.filterNewBenefit(formValue.benefits)
        : formValue.benefits,
    };

    if (formValue.period !== Period.FREE && formValue.priceCents) {
      payload.priceCents = formValue.priceCents;
    }

    if (formValue.parentId) {
      payload.parentId = parseInt(formValue.parentId as string);
    }

    if (this.isEdit && this.benefitsToRemove.length > 0) {
      payload.removedBenefitIds = this.benefitsToRemove;
    }

    return payload;
  }

  getPeriodLabel(period: Period): string {
    const labels: Record<Period, string> = {
      [Period.FREE]: 'Gratuit',
      [Period.MONTHLY]: 'Mensuel',
      [Period.BIMONTHLY]: 'Bimensuel',
      [Period.QUARTERLY]: 'Trimestriel',
      [Period.SEMIANNUAL]: 'Semestriel',
      [Period.ANNUAL]: 'Annuel',
    };
    return labels[period] || period;
  }

  goBack(): void {
    this.location.back();
  }

  private filterNewBenefit(data: any[]) {
    return data.filter((d) => d.id === null);
  }
}
