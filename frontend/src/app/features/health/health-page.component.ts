import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HealthApiService } from '../../core/services/health-api.service';
import { HealthStatus } from '../../core/models/health-status.model';

@Component({
  selector: 'app-health-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!--
      aria-live="polite" announces loading/error/success state changes
      to screen readers without interrupting ongoing speech.
    -->
    <section class="flex flex-col gap-6" aria-live="polite">

      <!-- ─── Page heading row ──────────────────────────────────────────── -->
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-2xl font-semibold tracking-tight text-balance
                   text-gray-900 dark:text-gray-100">
          Service Health
        </h2>

        <button
          type="button"
          (click)="reload()"
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white
                 transition-colors duration-150
                 hover:bg-primary-hover
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Refresh
        </button>
      </div>
      <!-- ─────────────────────────────────────────────────────────────── -->


      <!-- ─── Loading state ────────────────────────────────────────────── -->
      @if (healthResource.isLoading()) {
        <div
          class="flex min-h-48 items-center justify-center rounded-xl
                 border border-gray-200 bg-surface p-12
                 dark:border-gray-700 dark:bg-surface-dark"
          role="status"
          aria-label="Loading service health"
        >
          <div class="flex flex-col items-center gap-3">
            <!-- Spinner ring — purely decorative, labelled by parent -->
            <div
              class="size-10 animate-spin rounded-full
                     border-4 border-primary border-t-transparent"
              aria-hidden="true"
            ></div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Checking service health…
            </p>
          </div>
        </div>


      <!-- ─── Error state ───────────────────────────────────────────────── -->
      } @else if (healthResource.error()) {
        <div
          class="flex gap-3 rounded-xl
                 border border-red-200 bg-red-50 p-6
                 dark:border-red-800/40 dark:bg-red-900/20"
          role="alert"
        >
          <!-- Error icon -->
          <svg
            class="mt-0.5 size-5 shrink-0 text-red-500 dark:text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06
                 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72
                 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0
                 00-1.06-1.06L10 8.94 8.28 7.22z"
              clip-rule="evenodd"
            />
          </svg>

          <!-- Error copy — gap-1 instead of mt-* for layout spacing -->
          <div class="flex flex-col gap-1">
            <p class="font-semibold text-red-800 dark:text-red-300">
              Unable to reach the health endpoint
            </p>
            <p class="text-sm text-red-600 dark:text-red-400">
              Make sure the backend is running and the proxy is configured
              correctly.
            </p>
          </div>
        </div>


      <!-- ─── Success state ─────────────────────────────────────────────── -->
      } @else if (healthResource.value(); as data) {
        <div
          class="overflow-hidden rounded-xl
                 border border-gray-200 bg-surface shadow-sm
                 transition-shadow duration-200 hover:shadow-md
                 dark:border-gray-700 dark:bg-surface-dark"
        >

          <!-- Card header: service name + status badge -->
          <div
            class="flex items-center justify-between gap-4
                   border-b border-gray-100 px-6 py-4
                   dark:border-gray-700"
          >
            <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
              {{ data.serviceName }}
            </h3>

            <!--
              statusClass() returns the full badge colour string, e.g.:
              "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              Static classes set layout; [class] binding merges colour classes.
            -->
            <span
              class="inline-flex items-center gap-1.5 rounded-full
                     px-3 py-0.5 text-xs font-medium
                     select-none transition-colors duration-150"
              [class]="statusClass()"
            >
              <!-- Colour-inheriting dot indicator -->
              <span
                class="size-1.5 rounded-full bg-current opacity-75"
                aria-hidden="true"
              ></span>
              {{ statusLabel() }}
            </span>
          </div>
          <!-- ─── end card header ──────────────────────────────────────── -->


          <!--
            Metadata grid
            ─────────────────────────────────────────────────────────────
            Mobile  (1 col): explicit border-t on cells 2 & 3 act as
                             row separators.
            Desktop (2 col): cell 2 gets sm:border-t-0 + sm:border-l for
                             the column divider; cell 3 keeps border-t as
                             the row divider spanning both columns.
            ─────────────────────────────────────────────────────────────
          -->
          <dl class="grid grid-cols-1 sm:grid-cols-2">

            <!-- Version -->
            <div class="px-6 py-4">
              <dt class="text-xs font-medium uppercase tracking-wide
                         text-gray-500 dark:text-gray-400">
                Version
              </dt>
              <dd class="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
                {{ data.version }}
              </dd>
            </div>

            <!-- Environment -->
            <div
              class="border-t border-gray-100 px-6 py-4
                     dark:border-gray-700
                     sm:border-t-0 sm:border-l"
            >
              <dt class="text-xs font-medium uppercase tracking-wide
                         text-gray-500 dark:text-gray-400">
                Environment
              </dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {{ data.environment }}
              </dd>
            </div>

            <!-- Checked at — full-width in both layouts -->
            <div
              class="border-t border-gray-100 px-6 py-4
                     dark:border-gray-700
                     sm:col-span-2"
            >
              <dt class="text-xs font-medium uppercase tracking-wide
                         text-gray-500 dark:text-gray-400">
                Checked at (UTC)
              </dt>
              <dd class="mt-1 tabular-nums text-sm text-gray-900 dark:text-gray-100">
                {{ data.checkedAtUtc }}
              </dd>
            </div>

          </dl>
          <!-- ─── end metadata grid ────────────────────────────────────── -->

        </div>
      }

    </section>
  `,
})
export class HealthPageComponent {
  private readonly healthApi = inject(HealthApiService);

  readonly healthResource = rxResource<HealthStatus, undefined>({
    stream: () => this.healthApi.getHealth(),
  });

  readonly isHealthy = computed(
    () => this.healthResource.value()?.status?.toLowerCase() === 'healthy'
  );

  readonly statusLabel = computed(() => {
    const value = this.healthResource.value();
    return value?.status ?? 'Unknown';
  });

  readonly statusClass = computed(() =>
    this.isHealthy()
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  );

  reload(): void {
    this.healthResource.reload();
  }
}
