import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiAuthService } from '../../../auth/api-auth.service';
import { PersonalInfoData } from '../../../shared/interfaces/user-personnal-data';
import { CommonModule } from '@angular/common';
import { fr } from 'intl-tel-input/i18n';
import { ApiService } from '../../../shared/services/api.service';
import { SweetAlert, Toast } from '../../../helpers/sweet-alert';

declare var intlTelInput: any;

@Component({
  selector: 'app-user-edit',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.css',
})
export class UserEditComponent implements OnInit, AfterViewInit, OnDestroy {
  form: FormGroup;
  userId: number | null = null;
  userData: PersonalInfoData = { email: '' };
  saving = false;
  private iti: any;
  private initialPhone: string = '';
  countries: Array<{ name: string; iso2: string; dialCode: string }> = [];

  private itiReady = false;
  private userReady = false;

  @ViewChild('phoneInput') phoneInput!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: ApiAuthService,
    private zone: NgZone,
    private api: ApiService<any>
  ) {
    this.form = this.fb.group({
      email: [
        { value: '', disabled: false },
        [Validators.required, Validators.email],
      ],
      displayName: ['', [Validators.minLength(2)]],
      phone: ['', [Validators.required]],
      country: [''],
      address: [''],
      city: [''],
      lastName: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
    });

    this.form.get('email')?.disable({ emitEvent: false });
  }

  hasError(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.userId = idParam !== null ? +idParam : null;
    if (this.userId) {
      this.auth.getMe().subscribe({
        next: (res) => {
          this.userData = res.data;
          this.initialPhone = this.userData.phone || '';
          const [address, city] = this.splitLocation(res.data.location);
          this.form.patchValue({
            email: this.userData.email,
            displayName: this.userData.displayName || '',
            phone: this.userData.phone || '',
            lastName: this.userData.lastName || '',
            firstName: this.userData.firstName || '',
            country: this.userData.country || '',
            address: address ? address.trim() : '',
            city: city ? city.trim() : '',
          });
          this.markUserReady();
        },
        error: (err) => console.error(err),
      });
    } else {
      this.markUserReady();
    }
  }

  ngAfterViewInit(): void {
    const input = this.phoneInput.nativeElement as HTMLInputElement;

    this.zone.runOutsideAngular(() => {
      this.iti = intlTelInput(input, {
        initialCountry: 'ci',
        i18n: fr,
        preferredCountries: ['ci', 'fr', 'us'],
        separateDialCode: true,
        formatOnDisplay: true,
      });
    });

    const ready = this.iti.promise ? this.iti.promise : Promise.resolve();

    ready.then(() => {
      // validateur une seule fois
      const ctrl = this.form.get('phone')!;
      ctrl.setValidators([Validators.required, this.phoneValidator.bind(this)]);
      ctrl.updateValueAndValidity({ emitEvent: false });

      this.countries = (intlTelInput.getCountryData?.() ?? []).map(
        (d: any) => ({ name: d.name, iso2: d.iso2, dialCode: d.dialCode })
      );

      const selected = this.userData.country ? this.userData.country : '';
      const finded = this.countries.find(
        (country) => country.name === selected
      );

      this.form
        .get('country')
        ?.setValue(finded?.name ?? '', { emitEvent: false });

      const revalidate = () => {
        try {
          const utils = (window as any).intlTelInputUtils;
          const e164 = utils
            ? this.iti.getNumber(utils.numberFormat.E164)
            : input.value;
          // ⬇️ on stocke uniquement dans le FormControl (caché)
          ctrl.setValue(e164, { emitEvent: false });
        } catch {}
        ctrl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        // const sel = this.iti.getSelectedCountryData();
        // this.form
        //   .get('country')
        //   ?.setValue(sel?.name ?? '', { emitEvent: false });
      };
      input.addEventListener('input', revalidate);
      input.addEventListener('countrychange', revalidate);
      this.markItiReady();
    });
  }

  ngOnDestroy(): void {
    if (this.iti) {
      this.iti.destroy();
    }
  }

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

  reset() {
    this.router.navigate(['/users/profile']);
  }

  save() {
    if (!this.form.valid) return;
    this.saving = true;
    const { phone, city, country, address, lastName, firstName, displayName } =
      this.form.value;
    const fullNumber = this.iti ? this.iti.getNumber() : phone;
    const payload = {
      phone: fullNumber,
      lastName,
      firstName,
      displayName,
      location: `${address}, ${city}`,
      country,
    };

    this.api.updateProfile('auth/me/update-profile', payload).subscribe({
      next: () => {
        Toast.fire({
          icon: 'success',
          title: 'Changements effectués',
          didClose: () => {
            this.saving = false;
            this.reset();
          },
        });
      },
      error: (err) => {
        if (err.error.statusCode === 409) {
          const msg = err.error.data.message;
          SweetAlert.fire({
            icon: 'error',
            title: 'Erreur',
            text: msg,
            didClose: () => {
              this.saving = false;
            },
          });
        }
      },
    });
  }

  private splitLocation(location: string) {
    return location ? location.split(' :') : [];
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

  private markItiReady() {
    this.itiReady = true;
    this.maybeApplyInitialPhone();
  }

  private markUserReady() {
    this.userReady = true;
    this.maybeApplyInitialPhone();
  }
}
