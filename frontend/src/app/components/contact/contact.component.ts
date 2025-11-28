import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { Toast } from '../../helpers/sweet-alert';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent {
  contactForm: FormGroup;
  submitting = false;

  // Informations de la compagnie
  companyInfo = {
    name: 'ZikMuzik',
    address: "Abidjan, Côte d'Ivoire",
    fullAddress: 'Cocody, Riviera Palmeraie, Abidjan',
    phone: '+225 07 07 07 07 07',
    email: 'contact@ZikMuzik.ci',
    website: 'www.ZikMuzik.ci',
    socialMedia: {
      facebook: 'https://facebook.com/linkedmusic',
      instagram: 'https://instagram.com/linkedmusic',
      twitter: 'https://twitter.com/linkedmusic',
      linkedin: 'https://linkedin.com/company/linkedmusic',
    },
    hours: {
      weekdays: 'Lundi - Vendredi : 9h00 - 18h00',
      weekend: 'Samedi : 10h00 - 14h00',
      closed: 'Dimanche : Fermé',
    },
  };

  constructor(private fb: FormBuilder, private api: ApiService<any>) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      message: [
        '',
        [
          Validators.required,
          Validators.minLength(20),
          Validators.maxLength(1000),
        ],
      ],
    });
  }

  onSubmit(): void {
    if (this.contactForm.invalid || this.submitting) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formData = this.contactForm.value;

    this.api
      .create('contact', formData)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          Toast.fire({
            icon: 'success',
            title: 'Message envoyé',
            text: 'Nous vous répondrons dans les plus brefs délais',
          });
          this.contactForm.reset();
        },
        error: (err) => {
          Toast.fire({
            icon: 'error',
            title: 'Erreur',
            text: err?.error?.message || "Impossible d'envoyer le message",
          });
          console.error(err);
        },
      });
  }

  getErrorMessage(controlName: string): string {
    const control = this.contactForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) return 'Ce champ est requis';
    if (control.errors['email']) return 'Email invalide';
    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Minimum ${minLength} caractères requis`;
    }
    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `Maximum ${maxLength} caractères autorisés`;
    }
    if (control.errors['pattern']) return 'Format invalide';

    return '';
  }

  hasError(controlName: string): boolean {
    const control = this.contactForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }
}
