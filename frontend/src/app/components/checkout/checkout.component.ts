import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Subscription } from '../admin/pages/subscription-plans/subscription-plans.component';
import { Observable } from 'rxjs';
import { AuthUser } from '../../shared/interfaces/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../auth/auth.service';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { fr } from 'intl-tel-input/i18n';
import Swal from 'sweetalert2';
import { ApiResponse } from '../../shared/interfaces/response-formatter';
import { UserUpdateService } from '../../auth/user-update.service';

declare var intlTelInput: any;

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit, AfterViewInit, OnDestroy {
  user$: Observable<AuthUser | null>;
  user: AuthUser | null = null;
  loading = true;
  processing = false;
  error: string | null = null;
  plan: any;
  form: FormGroup;
  private iti?: any;
  private isoCountry: string = '';
  countries: Array<{ name: string; iso2: string; dialCode: string }> = [];
  private initialPhone: string = '';
  private itiReady = false;
  private userReady = false;

  @ViewChild('phoneInput')
  set phoneInput(element: ElementRef<HTMLInputElement | undefined>) {
    if (!element) return;
    if (this.iti) return;
    this.initPhoneInput(element.nativeElement!);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService<any>,
    private auth: AuthService,
    private fb: FormBuilder,
    private zone: NgZone,
    private userUpdateService: UserUpdateService
  ) {
    this.user$ = this.auth.user$;
    this.form = this.fb.group({
      address: ['', [Validators.required]],
      zipCode: ['', [Validators.required]],
      country: ['', [Validators.required]],
      city: ['', [Validators.required]],
      phone: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    const planId = parseInt(this.route.snapshot.paramMap.get('id') as string);
    if (planId) {
      this.loadPlanDetails(planId);
      this.patchFormWithUserData();
      this.markUserReady();
    } else {
      this.error = 'Aucun plan sélectionné';
      this.loading = false;
    }
  }

  private initPhoneInput(nativeElement: HTMLInputElement) {
    this.zone.runOutsideAngular(() => {
      this.iti = intlTelInput(nativeElement, {
        initialCountry: 'ci',
        i18n: fr,
        preferredCountries: ['ci', 'fr', 'us'],
        separateDialCode: true,
        formatOnDisplay: true,
      });
    });

    const ready = this.iti.promise ? this.iti.promise : Promise.resolve();
    ready.then(() => {
      const ctrl = this.form.get('phone')!;
      ctrl.setValidators([Validators.required, this.phoneValidator.bind(this)]);
      ctrl.updateValueAndValidity({ emitEvent: false });

      this.countries = (intlTelInput.getCountryData?.() ?? []).map(
        (d: any) => ({ name: d.name, iso2: d.iso2, dialCode: d.dialCode })
      );

      this.getCurrentUser();

      const selected = this.user?.country ? this.user.country : '';
      const finded = this.countries.find(
        (country) => country.name === selected
      );
      this.form
        .get('country')
        ?.setValue(finded?.name ?? '', { emitEvent: false });
      this.isoCountry = finded?.iso2.toUpperCase() ?? '';

      const revalidate = () => {
        try {
          const utils = (window as any).intlTelInput.utils;
          const e164 = utils
            ? this.iti.getNumber(utils.numberFormat.E164)
            : nativeElement.value;
          ctrl.setValue(e164, { emitEvent: false });
        } catch {}
        ctrl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      };

      nativeElement.addEventListener('input', revalidate);
      nativeElement.addEventListener('countrychange', revalidate);
      this.markItiReady();
    });
  }
  ngAfterViewInit(): void {}

  ngOnDestroy(): void {}

  phoneValidator(control: AbstractControl): ValidationErrors | null {
    const raw = (control.value ?? '').toString().trim();
    if (!raw) return null;
    if (!this.iti || !this.iti.isValidNumber) return null;

    try {
      return this.iti.isValidNumber() ? null : { invalidPhone: true };
    } catch {
      return null;
    }
  }

  countryChange(event: Event) {
    const value = (event.target as any).value;
    const finded = this.countries.find((country) => country.name === value);
    this.isoCountry = finded?.iso2.toUpperCase() ?? '';
  }

  patchFormWithUserData() {
    this.user$.subscribe((user) => {
      if (user) {
        this.user = user;
        this.form.patchValue({
          address: user.location || '',
          city: user.city || '',
          zipCode: user.zipCode,
          country: user.country,
          phone: user.phone,
        });
      }
    });
  }

  getCurrentUser() {
    this.auth.user$.subscribe((user) => {
      this.user = user;
    });
  }

  loadPlanDetails(planId: number) {
    this.loading = true;
    this.error = null;

    this.api.getOne('subscription-plans', planId).subscribe({
      next: (response) => {
        this.plan = response.data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement du plan:', err);
        this.error =
          'Impossible de charger les détails du plan. Veuillez réessayer.';
        this.loading = false;
      },
    });
  }

  cancel() {
    this.router.navigate(['/pricing']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  getPeriodLabel(period: string): string {
    const labels: { [key: string]: string } = {
      FREE: 'Gratuit',
      MONTHLY: 'Mensuel',
      BIMONTHLY: 'Bimestriel',
      QUARTERLY: 'Trimestriel',
      SEMIANNUAL: 'Semestriel',
      ANNUAL: 'Annuel',
      CUSTOM: 'Personnalisé',
    };
    return labels[period] || period;
  }
  isFreePlan(): boolean {
    return this.plan?.period === 'FREE';
  }

  isPopularPlan(): boolean {
    return this.plan?.period === 'BIMONTHLY';
  }

  private markItiReady() {
    this.itiReady = true;
    this.maybeApplyInitialPhone();
  }

  private markUserReady() {
    this.userReady = true;
    this.maybeApplyInitialPhone();
  }

  private maybeApplyInitialPhone() {
    if (!this.iti || !this.itiReady || !this.userReady) return;

    const initial = (this.initialPhone || this.form.get('phone')?.value || '')
      .toString()
      .trim();
    if (!initial) return;
    try {
      this.iti.setNumber(initial);
    } catch {}

    try {
      const utils = (window as any).intlTelInputUtils;
      const e164 = utils
        ? this.iti.getNumber(utils.numberFormat.E164)
        : initial;
      this.form.get('phone')?.setValue(e164, { emitEvent: false });
    } catch {}
  }

  checkout() {
    this.processing = true;
    const payload = this.form.value;
    payload.planId = this.plan.id;
    payload.country = this.isoCountry;
    this.api.create('users/payments', payload).subscribe({
      next: (res) => {
        this.userUpdateService.notifyUserUpdate(res.data.user);
        if (res.data.returnUrl) {
          this.router.navigate(['/payments/return'], {
            queryParams: {
              transaction_id: res.data.transactionId,
            },
          });
        }
        if (res.data.paymentUrl) {
          this.router.navigateByUrl(res.data.paymentUr);
        }
      },
      error: (err: ApiResponse<any> & { error?: any }) => {
        Swal.fire({
          title: err.data.title,
          icon: err.statusCode === 429 ? 'warning' : 'error',
          text: err.data.message,
        });
      },
    });
    this.processing = false;
  }
}
