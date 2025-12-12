import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { Toast } from '../../helpers/sweet-alert';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  submitted: boolean = false;
  private redirectUrl: string = '/';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.redirectUrl = params['redirect'] || '/';
    });
  }

  async onSubmit() {
    this.submitted = true;
    const { email, password } = this.loginForm.value;
    try {
      await this.auth.loginWithPassword(email, password);
      this.router.navigateByUrl(this.redirectUrl);
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
      this.router.navigateByUrl(this.redirectUrl);
    } catch (error) {
      console.log(error);
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  forgotPassword() {
    this.router.navigate(['/auth/forgot-password']);
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
