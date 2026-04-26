import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">

      <!-- ─── App shell header ────────────────────────────────────────────── -->
      <header
        class="sticky top-0 z-10
               border-b border-gray-200/80 bg-surface/95 backdrop-blur-sm
               px-6 py-4 shadow-sm
               dark:border-gray-700/60 dark:bg-surface-dark/95"
      >
        <div class="mx-auto flex max-w-5xl items-center gap-3">

          <!-- Logo badge -->
          <span
            class="inline-flex size-8 shrink-0 items-center justify-center
                   rounded-lg bg-primary text-sm font-bold text-white
                   shadow-sm ring-1 ring-white/20"
            aria-hidden="true"
          >G</span>

          <!-- App name -->
          <h1 class="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Greenfield Architecture
          </h1>

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
