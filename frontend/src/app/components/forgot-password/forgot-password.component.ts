import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService
      .forgotPassword(this.forgotPasswordForm.value.email)
      .then((response) => {
        this.loading = false;
        this.successMessage =
          'Un lien de réinitialisation a été envoyé à votre email';
        this.forgotPasswordForm.reset();
      })
      .catch((error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Une erreur est survenue';
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
