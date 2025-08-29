import { Routes } from '@angular/router';
import { AuthGuard, GuestGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./components/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'annonces/:category',
    canActivate: [GuestGuard],
    loadComponent: () =>
      import('./components/annonce/annonce.component').then(
        (m) => m.AnnonceComponent
      ),
  },
  {
    path: 'login',
    canActivate: [GuestGuard],
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    canActivate: [GuestGuard],
    loadComponent: () =>
      import('./components/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'verify',
    canActivate: [GuestGuard],
    loadComponent: () =>
      import('./components/verify-email/verify-email.component').then(
        (m) => m.VerifyEmailComponent
      ),
  },
  {
    path: 'auth/activate-account',
    canActivate: [GuestGuard],
    loadComponent: () =>
      import('./components/activation/activation.component').then(
        (m) => m.ActivationComponent
      ),
  },

  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
