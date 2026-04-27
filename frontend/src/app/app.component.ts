import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">

      <!-- ─── App shell header ────────────────────────────────────────────── -->
      <header
        class="sticky top-0 z-10
               border-b border-gray-200/80 bg-surface/95 backdrop-blur-sm
               px-6 py-4 shadow-sm
               dark:border-gray-700/60 dark:bg-surface-dark/95"
      >
        <div class="mx-auto flex max-w-5xl items-center gap-6">

          <!-- Logo badge -->
          <span
            class="inline-flex size-8 shrink-0 items-center justify-center
                   rounded-lg bg-primary text-sm font-bold text-white
                   shadow-sm ring-1 ring-white/20"
            aria-hidden="true"
          >G</span>

          <!-- App name -->
          <span class="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Greenfield Architecture
          </span>

          <!-- Nav links -->
          <nav class="flex items-center gap-1 ml-auto" aria-label="Main navigation">
            <a
              routerLink="/"
              routerLinkActive="bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
              [routerLinkActiveOptions]="{ exact: true }"
              class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600
                     transition-colors duration-150
                     hover:bg-gray-100 hover:text-gray-900
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                     dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              Health
            </a>
            <a
              routerLink="/deviations"
              routerLinkActive="bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
              class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600
                     transition-colors duration-150
                     hover:bg-gray-100 hover:text-gray-900
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                     dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              Deviations
            </a>
          </nav>

        </div>
      </header>
      <!-- ─────────────────────────────────────────────────────────────────── -->

      <!-- Main content fills remaining vertical space -->
      <main class="mx-auto w-full max-w-5xl flex-1 p-4 md:p-6">
        <router-outlet />
      </main>

    </div>
  `,
})
export class AppComponent {}
