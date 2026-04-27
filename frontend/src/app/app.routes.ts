import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'deviations',
    pathMatch: 'full',
  },
  {
    path: 'deviations',
    loadComponent: () =>
      import('./features/deviations/deviations-page.component').then(
        (m) => m.DeviationsPageComponent,
      ),
  },
  {
    path: 'health',
    loadComponent: () =>
      import('./features/health/health-page.component').then(
        (m) => m.HealthPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'deviations',
  },
];
