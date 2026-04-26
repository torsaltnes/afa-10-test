import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { DeviationStoreService } from '../../core/services/deviation-store.service';
import { DeviationFormComponent } from './deviation-form.component';
import { Deviation, UpsertDeviationRequest } from '../../core/models/deviation.model';

@Component({
  selector: 'app-deviations-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DeviationFormComponent, DatePipe],
  template: `
    <section class="flex flex-col gap-6" aria-label="Deviation management">

      <!-- ── Toolbar ──────────────────────────────────────────────────────── -->
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-2xl font-semibold text-balance tracking-tight
                   text-gray-900 dark:text-gray-100">
          Deviations
        </h2>

        <button
          type="button"
          (click)="store.startCreate()"
          class="inline-flex items-center gap-1.5 rounded-md bg-primary
                 px-4 py-2 text-sm font-medium text-white
                 transition-colors duration-150 hover:bg-primary-hover
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <!-- Plus icon -->
          <svg class="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          New Deviation
        </button>
      </div>

      <!-- ── Error banner ──────────────────────────────────────────────────── -->
      @if (store.error()) {
        <div
          class="flex items-start gap-3 rounded-xl
                 border border-danger/20 border-l-4 border-l-danger
                 bg-danger/5 p-4
                 dark:border-danger/30 dark:border-l-danger dark:bg-danger/10"
          role="alert"
        >
          <!-- Warning triangle icon -->
          <svg
            class="mt-0.5 size-4 shrink-0 text-danger"
            viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
          >
            <path fill-rule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673
                 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625
                 L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5
                 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clip-rule="evenodd"
            />
          </svg>

          <div class="flex flex-col gap-0.5">
            <p class="text-sm font-semibold text-danger">Something went wrong</p>
            <p class="text-sm text-red-700 dark:text-red-300">{{ store.error() }}</p>
          </div>
        </div>
      }

      <!-- ── Loading ───────────────────────────────────────────────────────── -->
      @if (store.loading()) {
        <div
          class="flex min-h-48 items-center justify-center rounded-xl
                 border border-gray-200 bg-surface p-12
                 dark:border-gray-700 dark:bg-surface-dark"
          role="status"
          aria-label="Loading deviations"
          aria-live="polite"
        >
          <div class="flex flex-col items-center gap-3">
            <div
              class="size-10 animate-spin rounded-full
                     border-4 border-primary border-t-transparent"
              aria-hidden="true"
            ></div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Loading deviations…</p>
          </div>
        </div>

      <!-- ── Create / Edit form ─────────────────────────────────────────────── -->
      } @else if (store.isCreateMode() || store.isEditMode()) {
        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-surface
                 shadow-sm dark:border-gray-700 dark:bg-surface-dark"
        >
          <!-- Card header -->
          <div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
            <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
              {{ store.isCreateMode() ? 'New Deviation' : 'Edit Deviation' }}
            </h3>
            <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {{
                store.isCreateMode()
                  ? 'Record a new architectural deviation.'
                  : 'Update the deviation details below.'
              }}
            </p>
          </div>

          <!-- Form body -->
          <div class="p-6">
            <app-deviation-form
              [initialValue]="store.selectedDeviation()"
              [mode]="store.isCreateMode() ? 'create' : 'edit'"
              [saving]="store.saving()"
              (submitted)="onSave($event)"
              (cancelled)="store.cancelEditing()"
            />
          </div>
        </div>

      <!-- ── Master / Detail layout ─────────────────────────────────────────── -->
      } @else {

        <!-- Empty state -->
        @if (store.isEmpty()) {
          <div
            class="flex min-h-64 flex-col items-center justify-center gap-4
                   rounded-xl border-2 border-dashed border-gray-300 p-12
                   text-center dark:border-gray-600"
          >
            <!-- Clipboard illustration -->
            <div class="flex size-14 items-center justify-center rounded-full
                        bg-gray-100 dark:bg-gray-800">
              <svg
                class="size-7 text-gray-400 dark:text-gray-500"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0
                     00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2
                     2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>

            <div class="flex flex-col gap-1">
              <p class="text-base font-semibold text-gray-700 dark:text-gray-300">
                No deviations yet
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Click
                <span class="font-semibold text-gray-700 dark:text-gray-300">
                  + New Deviation
                </span>
                to record the first one.
              </p>
            </div>
          </div>

        <!-- List + detail -->
        } @else {
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">

            <!-- ── Deviation list ──────────────────────────────────────────── -->
            <ul
              class="flex flex-col gap-2 lg:col-span-1
                     lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto
                     lg:pr-0.5"
              aria-label="Deviation list"
            >
              @for (deviation of store.sortedItems(); track deviation.id) {
                <li>
                  <button
                    type="button"
                    (click)="store.select(deviation.id)"
                    class="w-full rounded-lg border bg-surface px-4 py-3 text-left
                           transition-all duration-150
                           hover:bg-surface-muted
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-primary focus-visible:ring-offset-1
                           dark:bg-surface-dark dark:hover:bg-gray-800/60"
                    [class.border-primary]="store.selectedId() === deviation.id"
                    [class.bg-primary/5]="store.selectedId() === deviation.id"
                    [class.shadow-sm]="store.selectedId() === deviation.id"
                    [class.border-gray-200]="store.selectedId() !== deviation.id"
                    [class.dark:border-primary]="store.selectedId() === deviation.id"
                    [class.dark:bg-primary/10]="store.selectedId() === deviation.id"
                    [class.dark:border-gray-700]="store.selectedId() !== deviation.id"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <span class="line-clamp-2 text-sm font-medium leading-snug
                                   text-gray-900 dark:text-gray-100">
                        {{ deviation.title }}
                      </span>
                      <span
                        class="mt-0.5 shrink-0 inline-flex items-center rounded-full
                               px-2 py-0.5 text-xs font-medium
                               transition-colors duration-150"
                        [class]="severityClass(deviation.severity)"
                      >
                        {{ deviation.severity }}
                      </span>
                    </div>

                    <!-- Status with colour dot -->
                    <div class="mt-1.5 flex items-center gap-1.5">
                      <span
                        class="inline-block size-1.5 shrink-0 rounded-full"
                        [class]="deviation.status === 'Open'          ? 'bg-blue-500'    :
                                 deviation.status === 'Investigating'  ? 'bg-amber-500'   :
                                 deviation.status === 'Resolved'       ? 'bg-success'     :
                                                                         'bg-gray-400'"
                        aria-hidden="true"
                      ></span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        {{ deviation.status }}
                      </span>
                    </div>
                  </button>
                </li>
              }
            </ul>

            <!-- ── Detail panel ───────────────────────────────────────────── -->
            @if (store.selectedDeviation(); as sel) {
              <div
                class="overflow-hidden rounded-xl border border-gray-200
                       bg-surface shadow-sm
                       dark:border-gray-700 dark:bg-surface-dark lg:col-span-2"
              >
                <!-- Detail header -->
                <div
                  class="flex items-start justify-between gap-4
                         border-b border-gray-100 px-6 py-4 dark:border-gray-700"
                >
                  <div class="flex min-w-0 flex-col gap-0.5">
                    <h3 class="text-base font-semibold text-balance
                               text-gray-900 dark:text-gray-100">
                      {{ sel.title }}
                    </h3>
                    <p class="font-mono text-xs text-gray-400 dark:text-gray-500
                               truncate">
                      {{ sel.id }}
                    </p>
                  </div>
                  <span
                    class="mt-0.5 shrink-0 inline-flex items-center rounded-full
                           px-2.5 py-0.5 text-xs font-medium
                           transition-colors duration-150"
                    [class]="severityClass(sel.severity)"
                  >
                    {{ sel.severity }}
                  </span>
                </div>

                <!-- Detail body -->
                <div class="flex flex-col gap-5 px-6 py-5">
                  <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {{ sel.description }}
                  </p>

                  <dl class="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                    <!-- Status -->
                    <div class="flex flex-col gap-1">
                      <dt class="text-xs font-medium uppercase tracking-wide
                                 text-gray-500 dark:text-gray-400">
                        Status
                      </dt>
                      <dd>
                        <span
                          class="inline-flex items-center rounded-full
                                 px-2 py-0.5 text-xs font-medium"
                          [class]="sel.status === 'Open'          ? 'bg-blue-100  text-blue-800  dark:bg-blue-900/30  dark:text-blue-300'  :
                                   sel.status === 'Investigating'  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                                   sel.status === 'Resolved'       ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                                     'bg-gray-100  text-gray-600  dark:bg-gray-700/50  dark:text-gray-400'"
                        >{{ sel.status }}</span>
                      </dd>
                    </div>

                    <!-- Created -->
                    <div class="flex flex-col gap-1">
                      <dt class="text-xs font-medium uppercase tracking-wide
                                 text-gray-500 dark:text-gray-400">
                        Created
                      </dt>
                      <dd class="tabular-nums text-sm text-gray-900 dark:text-gray-100">
                        {{ sel.createdAtUtc | date:'mediumDate' }}
                      </dd>
                    </div>

                    <!-- Last modified -->
                    <div class="flex flex-col gap-1">
                      <dt class="text-xs font-medium uppercase tracking-wide
                                 text-gray-500 dark:text-gray-400">
                        Last modified
                      </dt>
                      <dd class="tabular-nums text-sm text-gray-900 dark:text-gray-100">
                        {{ sel.lastModifiedAtUtc | date:'mediumDate' }}
                      </dd>
                    </div>
                  </dl>
                </div>

                <!-- Detail actions -->
                <div
                  class="flex items-center gap-3 border-t border-gray-100
                         px-6 py-4 dark:border-gray-700"
                >
                  <!-- Edit -->
                  <button
                    type="button"
                    (click)="store.startEdit(sel.id)"
                    class="inline-flex items-center gap-1.5 rounded-md bg-primary
                           px-3 py-1.5 text-sm font-medium text-white
                           transition-colors duration-150 hover:bg-primary-hover
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <!-- Pencil icon -->
                    <svg class="size-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4
                               4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58
                               13.42a4 4 0 00-.885 1.343z" />
                    </svg>
                    Edit
                  </button>

                  <!-- Delete -->
                  <button
                    type="button"
                    (click)="confirmDelete(sel)"
                    [disabled]="store.deleting()"
                    class="inline-flex items-center gap-1.5 rounded-md
                           border border-danger/30 px-3 py-1.5 text-sm font-medium
                           text-danger transition-colors duration-150
                           hover:border-danger hover:bg-danger/10
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-danger focus-visible:ring-offset-2
                           disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    @if (store.deleting()) {
                      <!-- Spinner -->
                      <svg
                        class="size-3.5 animate-spin shrink-0"
                        viewBox="0 0 24 24" fill="none" aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" stroke="currentColor"
                                stroke-width="4" class="opacity-25"/>
                        <path fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              class="opacity-75"/>
                      </svg>
                      Deleting…
                    } @else {
                      <!-- Trash icon -->
                      <svg class="size-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd"
                          d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75
                             0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75
                             2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03
                             41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0
                             1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69
                             0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58
                             7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75
                             0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      Delete
                    }
                  </button>
                </div>
              </div>

            } @else {
              <!-- Nothing selected placeholder (desktop only) -->
              <div
                class="hidden items-center justify-center rounded-xl
                       border-2 border-dashed border-gray-200 p-12 text-center
                       dark:border-gray-700 lg:col-span-2 lg:flex"
              >
                <div class="flex flex-col items-center gap-3">
                  <!-- Cursor / select icon -->
                  <svg
                    class="size-8 text-gray-300 dark:text-gray-600"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                          d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-sm text-gray-400 dark:text-gray-500">
                    Select a deviation from the list to view details.
                  </p>
                </div>
              </div>
            }

          </div>
        }
      }

    </section>
  `,
})
export class DeviationsPageComponent implements OnInit {
  protected readonly store = inject(DeviationStoreService);

  ngOnInit(): void {
    this.store.load();
  }

  onSave(request: UpsertDeviationRequest): void {
    this.store.save(request);
  }

  confirmDelete(deviation: Deviation): void {
    if (confirm(`Delete "${deviation.title}"? This cannot be undone.`)) {
      this.store.remove(deviation.id);
    }
  }

  severityClass(severity: string): string {
    switch (severity) {
      case 'Critical':
      case 'High':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  }
}
