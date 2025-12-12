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
    path: 'announcements/edit/:id',
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
    path: 'announcements/:category',
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
    data: { guestPolicy: 'redirectIfAuth', redirectTo: '/' },
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
      redirectTo: '/',
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
    path: 'auth/forgot-password',
    canMatch: [guestCanMatch],
    canActivate: [guestCanActivate],
    data: { guestPolicy: 'redirectIfAuth', redirectTo: '/home' },
    loadComponent: () =>
      import('./components/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'auth/reset-password',
    canMatch: [guestCanMatch],
    canActivate: [guestCanActivate],
    loadComponent: () =>
      import('./components/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: 'pack/pricing-plan',
    canMatch: [guestCanMatch],
    canActivate: [guestCanActivate],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import('./components/pricing-plan/pricing-plan.component').then(
        (m) => m.PricingPlanComponent
      ),
  },
  {
    path: 'checkout/:id',
    canMatch: [authCanMatch],
    canActivate: [authCanMatch],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import('./components/checkout/checkout.component').then(
        (m) => m.CheckoutComponent
      ),
  },
  {
    path: 'payments/callback/return/:reference',
    canMatch: [authCanMatch],
    canActivate: [authCanMatch],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import('./components/payment-return/payment-return.component').then(
        (m) => m.PaymentReturnComponent
      ),
  },
  {
    path: 'profile/announcements',
    canMatch: [authCanMatch],
    canActivate: [authCanMatch],
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
    path: 'profile/memorises',
    canMatch: [authCanMatch],
    canActivate: [authCanActivate],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import(
        './components/announcements/recent-views/recent-views.component'
      ).then((m) => m.RecentViewsComponent),
  },
  {
    path: 'profile/likees',
    canMatch: [authCanMatch],
    canActivate: [authCanActivate],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import('./components/announcements/liked/liked.component').then(
        (m) => m.LikedComponent
      ),
  },
  {
    path: 'shop',
    canMatch: [guestCanMatch],
    canActivate: [guestCanActivate],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import('./components/shop/shop.component').then((m) => m.ShopComponent),
  },
  {
    path: 'about-us',
    canMatch: [guestCanMatch],
    canActivate: [guestCanActivate],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import('./components/about-us/about-us.component').then(
        (m) => m.AboutUsComponent
      ),
  },
  {
    path: 'contact',
    canMatch: [guestCanMatch],
    canActivate: [guestCanActivate],
    data: { guestPolicy: 'allow' },
    loadComponent: () =>
      import('./components/contact/contact.component').then(
        (m) => m.ContactComponent
      ),
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
    path: 'users',
    canMatch: [authCanMatch],
    canActivate: [authCanActivate],
    data: { guestPolicy: 'allow' },
    loadChildren: () =>
      import('./components/users/user.routes').then((m) => m.USER_ROUTES),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
