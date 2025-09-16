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

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: 'categories',
        component: CategoriePageComponent,
      },
      {
        path: 'categories/edit/:id',
        component: CategorieFormComponent,
      },
      {
        path: 'categories/new',
        component: CategorieFormComponent,
      },
      {
        path: 'services',
        component: ServiceTypesComponent,
      },
      {
        path: 'services/new',
        component: ServiceFormComponent,
      },
      {
        path: 'services/edit/:id',
        component: ServiceFormComponent,
      },
      {
        path: 'fields',
        component: FieldsComponent,
      },
      {
        path: 'fields/edit/:id',
        component: FieldFormComponent,
      },
      {
        path: 'fields/new',
        component: FieldFormComponent,
      },
      {
        path: 'fields/view/:id',
        component: FieldsViewComponent,
      },
      {
        path: 'services/view/:id',
        component: ServiceViewComponent,
      },
    ],
  },
];
