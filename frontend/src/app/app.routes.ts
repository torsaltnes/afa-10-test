import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/health/health-page.component').then(
        (m) => m.HealthPageComponent
      ),
  },
  {
    path: 'deviations',
    loadComponent: () =>
      import('./features/deviations/deviations-page.component').then(
        (m) => m.DeviationsPageComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
