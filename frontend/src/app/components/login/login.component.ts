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
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { Toast } from '../../helpers/sweet-alert';

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
    private auth: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async onSubmit() {
    this.submitted = true;
    const { email, password } = this.loginForm.value;
    try {
      await this.auth.loginWithPassword(email, password);
      this.router.navigate(['/home']);
      this.submitted = false;
    } catch (error: any) {
      const msg = this.extractError(error);
      Toast.fire({
        title: msg,
        icon: 'error',
        didClose: () => {
          this.submitted = false;
        },
      });
    }
  }

  async loginWithGoogle() {
    try {
      await this.auth.loginWithGoogle();
      this.router.navigate(['/home']);
    } catch (error) {
      console.log(error);
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToHome() {
    this.router.navigate(['/home']);
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
