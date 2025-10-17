import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { CategoriePageComponent } from './pages/categorie-page/categorie-page.component';
import { ServiceTypesComponent } from './pages/service-types/service-types.component';
import { CategorieFormComponent } from './pages/forms/categorie-form/categorie-form.component';
import { ServiceFormComponent } from './pages/forms/service-form/service-form.component';
import { FieldsComponent } from './pages/fields/fields.component';
import { FieldFormComponent } from './pages/forms/field-form/field-form.component';
import { FieldsViewComponent } from './pages/fields-view/fields-view.component';
import { ServiceViewComponent } from './pages/service-view/service-view.component';
import { SubscriptionPlansComponent } from './pages/subscription-plans/subscription-plans.component';
import { SubscriptionFormComponent } from './pages/forms/subscription-form/subscription-form.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: 'categories',
        loadComponent: () => CategoriePageComponent,
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
        path: 'services',
        loadComponent: () => ServiceTypesComponent,
      },
      {
        path: 'services/new',
        loadComponent: () => ServiceFormComponent,
      },
      {
        path: 'services/edit/:id',
        loadComponent: () => ServiceFormComponent,
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
        path: 'services/view/:id',
        loadComponent: () => ServiceViewComponent,
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
    ],
  },
];
