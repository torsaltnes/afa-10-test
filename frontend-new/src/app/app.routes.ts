import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/deviations', pathMatch: 'full' },
  {
    path: 'deviations',
    loadComponent: () =>
      import('./features/deviations/deviation-list/deviation-list.component').then(
        (m) => m.DeviationListComponent
      )
  },
  {
    path: 'deviations/new',
    loadComponent: () =>
      import('./features/deviations/deviation-form/deviation-form.component').then(
        (m) => m.DeviationFormComponent
      )
  },
  {
    path: 'deviations/:id/edit',
    loadComponent: () =>
      import('./features/deviations/deviation-form/deviation-form.component').then(
        (m) => m.DeviationFormComponent
      )
  }
];
