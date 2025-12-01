import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { CategoriePageComponent } from './pages/categorie-page/categorie-page.component';
import { CategorieFormComponent } from './pages/forms/categorie-form/categorie-form.component';
import { FieldsComponent } from './pages/fields/fields.component';
import { FieldFormComponent } from './pages/forms/field-form/field-form.component';
import { FieldsViewComponent } from './pages/fields-view/fields-view.component';
import { SubscriptionPlansComponent } from './pages/subscription-plans/subscription-plans.component';
import { SubscriptionFormComponent } from './pages/forms/subscription-form/subscription-form.component';
import { PublicationsComponent } from './pages/publications/publications.component';
import { PublicationDetailsComponent } from './pages/publication-details/publication-details.component';
import { BannerSlidesComponent } from './pages/banner-slides/banner-slides.component';
import { UsersComponent } from './pages/users/users.component';
import { UsersDetailsComponent } from './pages/users-details/users-details.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        redirectTo: 'publications',
        pathMatch: 'full',
      },
      {
        path: 'categories',
        loadComponent: () => CategoriePageComponent,
      },
      {
        path: 'banner-slides',
        loadComponent: () => BannerSlidesComponent,
      },
      {
        path: 'publications',
        loadComponent: () => PublicationsComponent,
      },
      {
        path: 'publications/:id',
        loadComponent: () => PublicationDetailsComponent,
      },
      {
        path: 'categories/edit/:id',
        loadComponent: () => CategorieFormComponent,
      },
      {
        path: 'categories/new',
        loadComponent: () => CategorieFormComponent,
      },
      {
        path: 'fields',
        loadComponent: () => FieldsComponent,
      },
      {
        path: 'fields/edit/:id',
        loadComponent: () => FieldFormComponent,
      },
      {
        path: 'fields/new',
        loadComponent: () => FieldFormComponent,
      },
      {
        path: 'fields/view/:id',
        loadComponent: () => FieldsViewComponent,
      },
      {
        path: 'subscription-plans',
        loadComponent: () => SubscriptionPlansComponent,
      },
      {
        path: 'subscription-plans/create',
        loadComponent: () => SubscriptionFormComponent,
      },
      {
        path: 'subscription-plans/edit/:id',
        loadComponent: () => SubscriptionFormComponent,
      },
      {
        path: 'users',
        loadComponent: () => UsersComponent,
      },
      {
        path: 'users/details/:id',
        loadComponent: () => UsersDetailsComponent,
      },
    ],
  },
];
