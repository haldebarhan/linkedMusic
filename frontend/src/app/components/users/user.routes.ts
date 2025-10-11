import { Routes } from '@angular/router';
import { UserComponent } from './user/user.component';

export const USER_ROUTES: Routes = [
  {
    path: '',
    component: UserComponent,
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./user-profile/user-profile.component').then(
            (m) => m.UserProfileComponent
          ),
      },
      {
        path: 'profile/change-password',
        loadComponent: () =>
          import('./change-password/change-password.component').then(
            (m) => m.ChangePasswordComponent
          ),
      },
      {
        path: 'profile/edit/:id',
        loadComponent: () =>
          import('./user-edit/user-edit.component').then(
            (m) => m.UserEditComponent
          ),
      },
    ],
  },
];
