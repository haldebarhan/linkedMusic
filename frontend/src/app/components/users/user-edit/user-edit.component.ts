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
import { UserUpdateService } from '../../../auth/user-update.service';

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

  avatarUrl: string | null = null;
  avatarFile: File | null = null;
  avatarPreview: string | null = null;
  uploadingAvatar = false;

  @ViewChild('phoneInput') phoneInput!: ElementRef;
  @ViewChild('avatarInput') avatarInput!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: ApiAuthService,
    private zone: NgZone,
    private api: ApiService<any>,
    private userUpdateService: UserUpdateService
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
      zipCode: [''],
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
          this.avatarPreview = res.data.profileImage;
          this.form.patchValue({
            email: this.userData.email,
            displayName: this.userData.displayName || '',
            phone: this.userData.phone || '',
            lastName: this.userData.lastName || '',
            firstName: this.userData.firstName || '',
            zipCode: this.userData.zipCode || '',
            country: this.userData.country || '',
            address: this.userData.location || '',
            city: this.userData.city || '',
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
          ctrl.setValue(e164, { emitEvent: false });
        } catch {}
        ctrl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
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

  async save() {
    if (!this.form.valid) return;
    this.saving = true;
    const {
      phone,
      city,
      country,
      address,
      lastName,
      zipCode,
      firstName,
      displayName,
    } = this.form.value;
    const fullNumber = this.iti ? this.iti.getNumber() : phone;
    const payload: Record<string, any> = {
      phone: fullNumber,
      lastName,
      firstName,
      displayName,
      zipCode,
      location: address,
      country,
      city,
    };

    const fd = new FormData();
    Object.keys(payload).forEach((key) => {
      fd.append(key, payload[key]);
    });
    if (this.avatarFile) fd.append('profileImage', this.avatarFile);

    this.api.updateProfile('auth/me/update-profile', fd).subscribe({
      next: (res) => {
        this.userUpdateService.notifyUserUpdate(res.data);
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

  // Avatar methods
  triggerAvatarUpload() {
    this.avatarInput.nativeElement.click();
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validation du fichier
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      SweetAlert.fire({
        icon: 'error',
        title: 'Format invalide',
        text: 'Veuillez choisir une image au format JPG, PNG ou WEBP.',
      });
      return;
    }

    if (file.size > maxSize) {
      SweetAlert.fire({
        icon: 'error',
        title: 'Fichier trop volumineux',
        text: 'La taille maximale autorisée est de 5 MB.',
      });
      return;
    }

    this.avatarFile = file;

    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.avatarPreview = e.target?.result as string;
      this.form.markAsDirty();
    };
    reader.readAsDataURL(file);
  }

  removeAvatar() {
    this.avatarFile = null;
    this.avatarPreview = null;
    this.avatarUrl = null;
    if (this.avatarInput) {
      this.avatarInput.nativeElement.value = '';
    }
    this.form.markAsDirty();
  }

  getAvatarDisplay(): string {
    if (this.avatarPreview) return this.avatarPreview;
    if (this.avatarUrl) return this.avatarUrl;
    return 'assets/images/default-avatar.png';
  }

  getInitials(): string {
    const firstName = this.form.get('firstName')?.value || '';
    const lastName = this.form.get('lastName')?.value || '';
    const displayName = this.form.get('displayName')?.value || '';

    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    if (displayName) {
      const parts = displayName.split(' ');
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      }
      return displayName.charAt(0).toUpperCase();
    }

    return this.form.get('email')?.value?.charAt(0).toUpperCase() || '?';
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

  //   private uploadAvatar(): Promise<void> {
  //     return new Promise((resolve, reject) => {
  //       if (!this.avatarFile) {
  //         resolve();
  //         return;
  //       }

  //       this.uploadingAvatar = true;
  //       const formData = new FormData();
  //       formData.append('avatar', this.avatarFile);

  //       // Adapter l'endpoint selon votre API
  //       this.api.upload('auth/me/upload-avatar', formData).subscribe({
  //         next: (res) => {
  //           this.avatarUrl = res.data.avatarUrl;
  //           this.uploadingAvatar = false;
  //           resolve();
  //         },
  //         error: (err) => {
  //           this.uploadingAvatar = false;
  //           console.error('Avatar upload error:', err);
  //           SweetAlert.fire({
  //             icon: 'error',
  //             title: 'Erreur',
  //             text: "Erreur lors de l'upload de l'avatar",
  //           });
  //           reject(err);
  //         },
  //       });
  //     });
  //   }
}
