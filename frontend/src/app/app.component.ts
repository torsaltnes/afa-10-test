import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">

      <!-- ─── App shell header ────────────────────────────────────────────── -->
      <header
        class="sticky top-0 z-10 h-14
               border-b border-gray-200/80 bg-surface/95 backdrop-blur-sm shadow-sm
               dark:border-gray-700/60 dark:bg-surface-dark/95"
      >
        <div class="mx-auto flex h-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">

          <!-- Left: logo mark + app name -->
          <div class="flex min-w-0 items-center gap-2.5">
            <span
              class="inline-flex size-8 shrink-0 items-center justify-center
                     rounded-lg bg-primary text-sm font-bold text-white
                     shadow-sm ring-1 ring-primary/30
                     ring-offset-1 ring-offset-white dark:ring-offset-surface-dark"
              aria-hidden="true"
            >G</span>

            <h1 class="truncate text-base font-semibold tracking-tight
                       text-gray-900 dark:text-gray-100">
              Greenfield
              <span class="hidden sm:inline font-normal text-gray-400
                           dark:text-gray-500"> / </span>
              <span class="hidden sm:inline">Architecture</span>
            </h1>
          </div>

          <!-- Right: primary navigation -->
          <nav class="flex shrink-0 items-center gap-1" aria-label="Main navigation">
            <a
              routerLink="/deviations"
              routerLinkActive="bg-primary/10 text-primary font-semibold
                               dark:bg-primary/20 dark:text-primary"
              ariaCurrentWhenActive="page"
              class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600
                     transition-colors duration-150
                     hover:bg-gray-100 hover:text-gray-900
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-primary focus-visible:ring-offset-1
                     dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              Deviations
            </a>

            <a
              routerLink="/health"
              routerLinkActive="bg-primary/10 text-primary font-semibold
                               dark:bg-primary/20 dark:text-primary"
              ariaCurrentWhenActive="page"
              class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600
                     transition-colors duration-150
                     hover:bg-gray-100 hover:text-gray-900
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-primary focus-visible:ring-offset-1
                     dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              Health
            </a>
          </nav>

        </div>
      </header>
      <!-- ─────────────────────────────────────────────────────────────────── -->

      <!-- Main content fills remaining vertical space -->
      <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:py-8">
        <router-outlet />
      </main>

    </div>
  `,
})
export class AppComponent {}
