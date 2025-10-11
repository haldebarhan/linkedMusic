import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiAuthService } from '../../../auth/api-auth.service';
import { Router } from '@angular/router';
import {
  passwordComplexityValidator,
  passwordMatchValidator,
} from '../../../shared/validators/password-match.validator';
import { CommonModule } from '@angular/common';
import { Toast } from '../../../helpers/sweet-alert';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css',
})
export class ChangePasswordComponent implements OnInit {
  permitted: boolean = false;
  form: FormGroup;
  saving: boolean = false;
  constructor(
    private authService: ApiAuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, passwordComplexityValidator()]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordMatchValidator('password', 'confirmPassword') }
    );
  }

  ngOnInit(): void {
    this.authService.getMe().subscribe({
      next: (res) => {
        this.permitted = res.data.provider === 'password';
        if (!this.permitted) {
          this.router.navigate(['/users/profile']);
        }
      },
      error: (err) => {},
    });
  }

  hasError(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }

  showErrorMessage(ctrl: string) {
    let message = '';
    if (this.form.get(ctrl)?.errors?.['required'])
      message = ' Le mot de passe est obligatoire.';
    if (this.form.get(ctrl)?.errors?.['minlength'])
      message = `Le mot de passe doit contenir au moins ${
        this.form.get(ctrl)?.errors?.['minlength'].requiredLength
      } caractères`;

    if (this.form.get(ctrl)?.errors?.['passwordComplexity'])
      message =
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.';
    return message;
  }

  save() {
    if (!this.form.valid) return;
    this.saving = true;
    const { password } = this.form.value;
    this.authService.changePassword(password).subscribe({
      next: () => {
        Toast.fire({
          icon: 'success',
          text: 'Action reussie',
          didClose: () => {
            this.router.navigate(['/users/profile']);
          },
        });
      },
      error: (err) => {
        console.log(err);
        this.saving = false;
      },
    });
  }
  reset() {
    this.router.navigate(['/users/profile']);
  }
}
