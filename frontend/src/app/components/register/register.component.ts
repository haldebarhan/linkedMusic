import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ApiAuthService } from '../../auth/api-auth.service';
import { AuthService } from '../../auth/auth.service';
import { SweetAlert, Toast } from '../../helpers/sweet-alert';

@Component({
  selector: 'app-register',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  signupForm: FormGroup;
  submitted: boolean = false;
  selectedFile: File | null = null;
  fileName = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: ApiAuthService,
    private auth: AuthService
  ) {
    this.signupForm = this.fb.group({
      pseudo: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.required, Validators.email]],
      photo: [null],
    });
  }

  onSubmit() {
    this.submitted = true;
    const { pseudo, password, email } = this.signupForm.value;
    const formData = new FormData();
    formData.append('pseudo', pseudo);
    formData.append('email', email);
    formData.append('password', password);

    if (this.selectedFile) {
      formData.append(
        'profileImage',
        this.selectedFile,
        this.selectedFile.name
      );
    }
    this.authService.register(formData).subscribe({
      next: () => {
        Toast.fire({
          title: 'Inscription terminée',
          icon: 'success',
          didClose: () => {
            this.router.navigate(['/verify'], {
              queryParams: { email },
            });
            this.signupForm.reset();
            this.submitted = false;
          },
        });
      },
      error: (err) => {
        SweetAlert.fire({
          title: 'Erreur rencontée',
          text: `${err.error.data.message}`,
          icon: 'error',
          didClose: () => (this.submitted = false),
        });
      },
      complete: () => {},
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
  goToHome() {
    this.router.navigate(['/home']);
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
    }
    this.fileName = this.selectedFile?.name ?? '';
  }

  async registerWithGoogle() {
    try {
      await this.auth.registerWithGoogle();
      Toast.fire({
        title: 'Inscription terminée',
        icon: 'success',
        didClose: () => {
          this.router.navigate(['/home']);
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
}
