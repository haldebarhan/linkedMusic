import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ApiAuthService } from '../../auth/api-auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: ApiAuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    this.submitted = true;
    const { email, password } = this.loginForm.value;
    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.router.navigate(['/home']);
        this.submitted = false;
      },
      error: (err: HttpErrorResponse) => {
        const msg = this.extractError(err);
        console.error('Login failed', msg);
        this.loginForm.reset();
      },
    });
    this.submitted = false;
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  private extractError(err: HttpErrorResponse): string {
    // Status 0 = serveur injoignable / CORS
    if (err.status === 0) return 'Impossible de joindre le serveur.';
    // Essaie d’extraire un message utile selon ton format backend
    const e = err.error;
    if (typeof e === 'string') return e;
    return (
      e?.message ||
      e?.data?.message ||
      e?.error ||
      (err.status === 401
        ? 'Identifiants invalides.'
        : err.statusText || 'Une erreur est survenue.')
    );
  }
}
