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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: ApiAuthService
  ) {
    this.signupForm = this.fb.group({
      lastName: ['', Validators.required],
      firstName: ['', [Validators.required]],
      password: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      photo: [null, Validators.required],
    });
  }

  onSubmit() {
    this.submitted = true;
    const { lastName, firstName, password, phone, email } =
      this.signupForm.value;
    const formData = new FormData();
    formData.append('lastName', lastName);
    formData.append('firstName', firstName);
    formData.append('password', password);
    formData.append('phone', phone);
    formData.append('email', email);

    if (this.selectedFile) {
      formData.append(
        'profileImage',
        this.selectedFile,
        this.selectedFile.name
      );
    }
    this.authService.register(formData).subscribe({
      next: () => {
        this.router.navigate(['/verify'], {
          queryParams: { email },
        });
        this.signupForm.reset();
        this.submitted = false;
      },
      error: (err) => console.error('Registration failed', err),
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
    }
  }
}
