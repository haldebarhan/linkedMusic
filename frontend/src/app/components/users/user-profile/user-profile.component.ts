import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiAuthService } from '../../../auth/api-auth.service';
import { Router } from '@angular/router';

export type userProfile = {
  email: string;
  displayName: string | null;
  phone: string | null;
  lastName: string | null;
  firstName: string | null;
  country: string | null;
  city: string | null;
  zipCode: string | null;
};

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
})
export class UserProfileComponent implements OnInit, OnDestroy {
  data: any;
  completProfile: userProfile = {
    email: '',
    displayName: null,
    phone: null,
    lastName: null,
    firstName: null,
    country: null,
    city: null,
    zipCode: null,
  };
  completed: boolean = false;
  showButton = false;
  constructor(private authService: ApiAuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.getMe().subscribe({
      next: (res) => {
        this.showButton = res.data.provider
          ? res.data.provider === 'password'
          : false;
        this.data = res.data;
        this.data.location = this.formatAddress(
          this.data.location,
          this.data.city,
          this.data.country
        );
        this.completProfile = {
          displayName: this.data.displayName,
          phone: this.data.phone,
          lastName: this.data.lastName,
          firstName: this.data.firstName,
          email: this.data.email,
          country: this.data.country,
          zipCode: this.data.zipCode,
          city: this.data.city,
        };
        this.completed = Object.values(this.completProfile).every(
          (value) => value !== null
        );
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  getAvatarUrl(): string {
    return this.data.profileImage;
  }

  getInitials(): string {
    if (!this.data) return '?';

    const firstName = this.data.firstName || '';
    const lastName = this.data.lastName || '';
    const displayName = this.data.displayName || '';

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

    return this.data.email?.charAt(0).toUpperCase() || '?';
  }

  displayValue(value: string) {
    return value ?? '---';
  }

  goToEdit() {
    this.router.navigate(['/users/profile/edit', this.data.id]);
  }

  fullLocation(zipCode: string, location: string) {
    return zipCode && location
      ? `${zipCode} ${location}`
      : location || zipCode || '---';
  }

  ngOnDestroy(): void {
    this.showButton = false;
  }

  changePassword() {
    this.router.navigate(['/users/profile/change-password']);
  }

  private formatAddress(location: string, city: string, country: string) {
    const address =
      location && city ? `${location}, ${city}` : location ? location : '';
    const fullAddress = country ? `${address}, ${country}` : `${address}`;
    return fullAddress;
  }
}
