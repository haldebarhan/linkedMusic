import { Routes } from '@angular/router';
import { RoleGuard } from './auth/role.guard';
import {
  authCanActivate,
  authCanMatch,
  guestCanActivate,
  guestCanMatch,
} from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'annonces/publier',
    canMatch: [authCanMatch],
    canActivate: [authCanActivate],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import(
        './components/announcements-post/announcements-post.component'
      ).then((m) => m.AnnouncementsPostComponent),
  },
  {
    path: 'annonces/publier/:category',
    canMatch: [authCanMatch],
    canActivate: [authCanActivate],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import('./components/post-form/post-form.component').then(
        (m) => m.PostFormComponent
      ),
  },
  {
    path: 'announcemnts/edit/:id',
    canMatch: [authCanMatch],
    canActivate: [authCanActivate],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import('./components/post-form/post-form.component').then(
        (m) => m.PostFormComponent
      ),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./components/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'annonces/musiciens',
    canMatch: [guestCanMatch],
    canActivate: [guestCanActivate],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import('./components/announcements/musiciens/musiciens.component').then(
        (m) => m.MusiciensComponent
      ),
  },
  {
    path: 'announcemnts/:category',
    canMatch: [guestCanMatch],
    canActivate: [guestCanActivate],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import(
        './components/announcements/announcement/announcement.component'
      ).then((m) => m.AnnouncementComponent),
  },
  {
    path: 'announcemnts/details/:id',
    canMatch: [guestCanMatch],
    canActivate: [guestCanActivate],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import(
        './components/announcements/announcement-detail/announcement-detail.component'
      ).then((m) => m.AnnouncementDetailComponent),
  },
  {
    path: 'login',
    canMatch: [guestCanMatch],
    canActivate: [guestCanActivate],
    data: { guestPolicy: 'redirectIfAuth', redirectTo: '/home' },
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    canMatch: [guestCanMatch],
    canActivate: [guestCanActivate],
    data: {
      guestPolicy: 'redirectIfAuth',
      redirectTo: '/home',
    },
    loadComponent: () =>
      import('./components/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'verify',
    canMatch: [guestCanMatch],
    canActivate: [guestCanActivate],
    data: { guestPolicy: 'redirectIfAuth', redirectTo: '/home' },
    loadComponent: () =>
      import('./components/verify-email/verify-email.component').then(
        (m) => m.VerifyEmailComponent
      ),
  },
  {
    path: 'auth/activate-account',
    canMatch: [guestCanMatch],
    canActivate: [guestCanActivate],
    data: { guestPolicy: 'redirectIfAuth', redirectTo: '/home' },
    loadComponent: () =>
      import('./components/activation/activation.component').then(
        (m) => m.ActivationComponent
      ),
  },
  {
    path: 'profile/announcements',
    canMatch: [authCanMatch],
    canActivate: [authCanActivate],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import(
        './components/announcements/user-announcements/user-announcements.component'
      ).then((m) => m.UserAnnouncementsComponent),
  },
  {
    path: 'profile/announcements/:id',
    canMatch: [authCanMatch],
    canActivate: [authCanActivate],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import(
        './components/announcements/user-announcements-details/user-announcements-details.component'
      ).then((m) => m.UserAnnouncementsDetailsComponent),
  },
  {
    path: 'profile/messages',
    canMatch: [authCanMatch],
    canActivate: [authCanActivate],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import(
        './components/messages/user-messages/user-messages.component'
      ).then((m) => m.UserMessagesComponent),
  },
  {
    path: 'admin',
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () =>
      import('./components/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
