import { Routes } from '@angular/router';

export const deviationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./deviation-list/deviation-list.page').then(
        (m) => m.DeviationListPage,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./deviation-new/deviation-new.page').then(
        (m) => m.DeviationNewPage,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./deviation-detail/deviation-detail.page').then(
        (m) => m.DeviationDetailPage,
      ),
  },
];
