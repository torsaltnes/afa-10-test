import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DeviationListStore } from '../data/deviation-list.store';
import { SeverityBadgeComponent } from '../components/severity-badge.component';
import { StatusBadgeComponent } from '../components/status-badge.component';
import {
  DeviationDto,
  DEVIATION_STATUS_LABELS,
  DEVIATION_SEVERITY_LABELS,
  DEVIATION_TYPE_LABELS,
  DeviationSeverity,
  DeviationStatus,
  DeviationType,
} from '../../../core/models/deviation.model';

@Component({
  selector: 'app-deviation-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DeviationListStore],
  imports: [RouterLink, SeverityBadgeComponent, StatusBadgeComponent],
  template: `
    <div class="flex flex-col gap-6 p-4 md:p-6">

      <!-- ── Page header ─────────────────────────────────────────────────── -->
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h1 class="text-heading font-semibold text-balance text-text-primary">
            Deviations
          </h1>
          <p class="text-caption text-text-secondary">
            {{ store.totalCount() }} total records
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Export -->
          <button
            class="flex items-center gap-2 rounded-lg border border-border bg-surface-raised
                   px-4 py-2 text-body font-medium text-text-primary
                   transition-colors duration-150
                   hover:bg-surface-overlay
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                   disabled:cursor-not-allowed disabled:opacity-50"
            [disabled]="store.exportLoading()"
            (click)="store.export()"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                 stroke="currentColor" stroke-width="1.4" aria-hidden="true">
              <path d="M7 2v7M4 6l3 3 3-3" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 11h10" stroke-linecap="round"/>
            </svg>
            @if (store.exportLoading()) { Exporting… } @else { Export CSV }
          </button>

          <!-- New Deviation -->
          <a
            routerLink="/deviations/new"
            class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2
                   text-body font-medium text-white transition-colors duration-150
                   hover:bg-primary-hover
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"
                 aria-hidden="true">
              <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round"/>
            </svg>
            New Deviation
          </a>
        </div>
      </div>

      <!-- ── Search & Filters ────────────────────────────────────────────── -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Search -->
        <div class="relative min-w-0 flex-1 sm:max-w-xs">
          <span
            class="pointer-events-none absolute inset-y-0 left-3 flex items-center
                   text-text-secondary"
            aria-hidden="true"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                 stroke="currentColor" stroke-width="1.5">
              <circle cx="6" cy="6" r="4"/>
              <path d="M9.5 9.5L13 13" stroke-linecap="round"/>
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search title or reference…"
            class="w-full rounded-lg border border-border bg-surface-raised
                   py-2 pl-9 pr-3 text-body text-text-primary
                   placeholder:text-text-secondary transition-colors duration-150
                   focus:border-primary focus:outline-none
                   focus-visible:ring-2 focus-visible:ring-primary"
            [value]="store.searchQuery()"
            (input)="onSearchInput($event)"
            aria-label="Search deviations"
          />
        </div>

        <!-- Status filter -->
        <select
          class="rounded-lg border border-border bg-surface-raised
                 px-3 py-2 text-body text-text-primary transition-colors duration-150
                 focus:border-primary focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-primary"
          [value]="store.statusFilter()"
          (change)="onStatusChange($event)"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          @for (opt of statusOptions; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>

        <!-- Severity filter -->
        <select
          class="rounded-lg border border-border bg-surface-raised
                 px-3 py-2 text-body text-text-primary transition-colors duration-150
                 focus:border-primary focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-primary"
          [value]="store.severityFilter()"
          (change)="onSeverityChange($event)"
          aria-label="Filter by severity"
        >
          <option value="">All Severities</option>
          @for (opt of severityOptions; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>

        <!-- Type filter -->
        <select
          class="rounded-lg border border-border bg-surface-raised
                 px-3 py-2 text-body text-text-primary transition-colors duration-150
                 focus:border-primary focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-primary"
          [value]="store.typeFilter()"
          (change)="onTypeChange($event)"
          aria-label="Filter by type"
        >
          <option value="">All Types</option>
          @for (opt of typeOptions; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>

        <!-- Clear filters -->
        @if (store.activeFilterCount() > 0 || store.searchQuery()) {
          <button
            class="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2
                   text-body text-text-secondary transition-colors duration-150
                   hover:bg-surface-raised hover:text-text-primary
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            (click)="store.clearFilters()"
            type="button"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
                 aria-hidden="true">
              <path d="M9.78 3.22L8.72 2.16 6 4.88 3.28 2.16 2.22 3.22 4.94 5.94 2.22 8.66 3.28 9.72 6 6.94 8.72 9.72 9.78 8.66 7.06 5.94z"/>
            </svg>
            Clear
            @if (store.activeFilterCount() > 0) {
              <span
                class="flex size-4 items-center justify-center rounded-full
                       bg-primary text-[10px] font-bold text-white"
              >
                {{ store.activeFilterCount() }}
              </span>
            }
          </button>
        }
      </div>

      <!-- ── Table ────────────────────────────────────────────────────────── -->
      <div class="overflow-hidden rounded-xl border border-border bg-surface">

        @if (store.loading()) {
          <!-- Loading skeleton -->
          <div class="flex flex-col gap-0">
            @for (_ of skeletonRows; track $index) {
              <div
                class="flex animate-pulse items-center gap-4 border-b border-border px-4 py-4
                       last:border-0"
              >
                <div class="h-3 w-24 rounded-full bg-surface-raised"></div>
                <div class="h-3 flex-1 rounded-full bg-surface-raised"></div>
                <div class="h-3 w-16 rounded-full bg-surface-raised"></div>
                <div class="h-5 w-16 rounded-full bg-surface-raised"></div>
                <div class="h-5 w-20 rounded-full bg-surface-raised"></div>
              </div>
            }
          </div>
        } @else if (store.error()) {
          <!-- Error state -->
          <div class="flex flex-col items-center gap-3 py-12 text-center">
            <div
              class="flex size-10 items-center justify-center rounded-full bg-danger/10"
              aria-hidden="true"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                   stroke="currentColor" stroke-width="1.5">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 6v5M10 14h.01" stroke-linecap="round"/>
              </svg>
            </div>
            <p class="text-body font-medium text-text-primary">Failed to load deviations</p>
            <p class="text-caption text-text-secondary">
              {{ store.error()?.message ?? 'An unexpected error occurred' }}
            </p>
            <button
              class="mt-2 rounded-lg bg-primary px-4 py-2 text-body font-medium text-white
                     transition-colors duration-150 hover:bg-primary-hover
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              (click)="store.reload()"
              type="button"
            >
              Retry
            </button>
          </div>
        } @else if (store.items().length === 0) {
          <!-- Empty state -->
          <div class="flex flex-col items-center gap-3 py-12 text-center">
            <div
              class="flex size-12 items-center justify-center rounded-full bg-surface-raised"
              aria-hidden="true"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <path d="M9 12h6M9 16h4" stroke-linecap="round"/>
              </svg>
            </div>
            <p class="text-body font-medium text-text-primary">No deviations found</p>
            <p class="text-caption text-text-secondary">
              @if (store.activeFilterCount() > 0 || store.searchQuery()) {
                Try adjusting your search or filters.
              } @else {
                Register your first deviation to get started.
              }
            </p>
            <a
              routerLink="/deviations/new"
              class="mt-2 rounded-lg bg-primary px-4 py-2 text-body font-medium text-white
                     transition-colors duration-150 hover:bg-primary-hover
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Register Deviation
            </a>
          </div>
        } @else {
          <!-- Data table -->
          <div class="overflow-x-auto">
            <table class="w-full text-body" role="grid">
              <thead>
                <tr class="border-b border-border">
                  <th
                    class="px-4 py-3 text-left text-caption font-medium text-text-secondary"
                    scope="col"
                  >
                    <button
                      class="flex items-center gap-1 transition-colors duration-150
                             hover:text-text-primary focus-visible:outline-none"
                      (click)="store.sort('referenceNumber')"
                    >
                      Ref #
                      <span aria-hidden="true">{{ sortIcon('referenceNumber') }}</span>
                    </button>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-caption font-medium text-text-secondary"
                    scope="col"
                  >
                    <button
                      class="flex items-center gap-1 transition-colors duration-150
                             hover:text-text-primary focus-visible:outline-none"
                      (click)="store.sort('title')"
                    >
                      Title
                      <span aria-hidden="true">{{ sortIcon('title') }}</span>
                    </button>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-caption font-medium text-text-secondary"
                    scope="col"
                  >
                    Type
                  </th>
                  <th
                    class="px-4 py-3 text-left text-caption font-medium text-text-secondary"
                    scope="col"
                  >
                    <button
                      class="flex items-center gap-1 transition-colors duration-150
                             hover:text-text-primary focus-visible:outline-none"
                      (click)="store.sort('severity')"
                    >
                      Severity
                      <span aria-hidden="true">{{ sortIcon('severity') }}</span>
                    </button>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-caption font-medium text-text-secondary"
                    scope="col"
                  >
                    <button
                      class="flex items-center gap-1 transition-colors duration-150
                             hover:text-text-primary focus-visible:outline-none"
                      (click)="store.sort('status')"
                    >
                      Status
                      <span aria-hidden="true">{{ sortIcon('status') }}</span>
                    </button>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-caption font-medium text-text-secondary"
                    scope="col"
                  >
                    Reporter
                  </th>
                  <th
                    class="px-4 py-3 text-left text-caption font-medium text-text-secondary"
                    scope="col"
                  >
                    <button
                      class="flex items-center gap-1 transition-colors duration-150
                             hover:text-text-primary focus-visible:outline-none"
                      (click)="store.sort('createdAt')"
                    >
                      Created
                      <span aria-hidden="true">{{ sortIcon('createdAt') }}</span>
                    </button>
                  </th>
                  <th
                    class="px-4 py-3 text-left text-caption font-medium text-text-secondary"
                    scope="col"
                  >
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (row of store.items(); track row.id) {
                  <tr
                    class="border-b border-border transition-colors duration-150
                           hover:bg-surface-raised last:border-0"
                  >
                    <td class="px-4 py-3 font-mono text-caption text-text-secondary">
                      {{ row.referenceNumber }}
                    </td>
                    <td class="max-w-xs px-4 py-3">
                      <p class="truncate font-medium text-text-primary">{{ row.title }}</p>
                      <p class="truncate text-caption text-text-secondary">
                        {{ row.department }} &middot; {{ row.location }}
                      </p>
                    </td>
                    <td class="px-4 py-3 text-caption text-text-secondary">
                      {{ typeLabel(row) }}
                    </td>
                    <td class="px-4 py-3">
                      <app-severity-badge [severity]="row.severity" />
                    </td>
                    <td class="px-4 py-3">
                      <app-status-badge [status]="row.status" />
                    </td>
                    <td class="px-4 py-3 text-caption text-text-secondary">
                      {{ row.reportedBy }}
                    </td>
                    <td class="px-4 py-3 text-caption text-text-secondary">
                      {{ formatDate(row.createdAt) }}
                    </td>
                    <td class="px-4 py-3">
                      <a
                        [routerLink]="['/deviations', row.id]"
                        class="rounded-md px-3 py-1 text-caption font-medium text-primary
                               transition-colors duration-150
                               hover:bg-primary/10
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-primary"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div
            class="flex flex-wrap items-center justify-between gap-3
                   border-t border-border px-4 py-3"
          >
            <span class="text-caption text-text-secondary">
              {{ store.paginationLabel() }}
            </span>
            <div class="flex items-center gap-2">
              <button
                class="rounded-md border border-border px-3 py-1 text-caption
                       text-text-secondary transition-colors duration-150
                       hover:bg-surface-raised hover:text-text-primary
                       disabled:cursor-not-allowed disabled:opacity-40
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                [disabled]="!store.hasPreviousPage()"
                (click)="store.goToPage(store.currentPage() - 1)"
                type="button"
              >
                ← Previous
              </button>

              <!-- Page numbers (show up to 5) -->
              @for (p of visiblePages(); track p) {
                <button
                  class="rounded-md px-3 py-1 text-caption transition-colors duration-150
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  [class]="p === store.currentPage()
                    ? 'bg-primary text-white'
                    : 'border border-border text-text-secondary hover:bg-surface-raised'"
                  (click)="store.goToPage(p)"
                  type="button"
                  [attr.aria-current]="p === store.currentPage() ? 'page' : null"
                >
                  {{ p }}
                </button>
              }

              <button
                class="rounded-md border border-border px-3 py-1 text-caption
                       text-text-secondary transition-colors duration-150
                       hover:bg-surface-raised hover:text-text-primary
                       disabled:cursor-not-allowed disabled:opacity-40
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                [disabled]="!store.hasNextPage()"
                (click)="store.goToPage(store.currentPage() + 1)"
                type="button"
              >
                Next →
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class DeviationListPage {
  protected readonly store = inject(DeviationListStore);

  protected readonly skeletonRows = Array(5);

  // ── Option arrays for selects ───────────────────────────────────────────
  protected readonly statusOptions: { value: DeviationStatus; label: string }[] = [
    { value: 'Registered', label: DEVIATION_STATUS_LABELS['Registered'] },
    { value: 'Assessed', label: DEVIATION_STATUS_LABELS['Assessed'] },
    { value: 'Investigating', label: DEVIATION_STATUS_LABELS['Investigating'] },
    { value: 'CorrectiveAction', label: DEVIATION_STATUS_LABELS['CorrectiveAction'] },
    { value: 'Closed', label: DEVIATION_STATUS_LABELS['Closed'] },
  ];

  protected readonly severityOptions: { value: DeviationSeverity; label: string }[] = [
    { value: 'Critical', label: DEVIATION_SEVERITY_LABELS['Critical'] },
    { value: 'High', label: DEVIATION_SEVERITY_LABELS['High'] },
    { value: 'Medium', label: DEVIATION_SEVERITY_LABELS['Medium'] },
    { value: 'Low', label: DEVIATION_SEVERITY_LABELS['Low'] },
  ];

  protected readonly typeOptions: { value: DeviationType; label: string }[] = [
    { value: 'Deviation', label: DEVIATION_TYPE_LABELS['Deviation'] },
    { value: 'NonConformance', label: DEVIATION_TYPE_LABELS['NonConformance'] },
    { value: 'Incident', label: DEVIATION_TYPE_LABELS['Incident'] },
    { value: 'NearMiss', label: DEVIATION_TYPE_LABELS['NearMiss'] },
  ];

  // ── Derived ─────────────────────────────────────────────────────────────
  protected readonly visiblePages = computed(() => {
    const total = this.store.totalPages();
    const current = this.store.currentPage();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  // ── Event handlers ───────────────────────────────────────────────────────
  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.store.setSearch(value);
  }

  protected onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as DeviationStatus | '';
    this.store.setStatusFilter(value);
  }

  protected onSeverityChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as DeviationSeverity | '';
    this.store.setSeverityFilter(value);
  }

  protected onTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as DeviationType | '';
    this.store.setTypeFilter(value);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  protected typeLabel(row: DeviationDto): string {
    return DEVIATION_TYPE_LABELS[row.type] ?? row.type;
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
  }

  protected sortIcon(column: string): string {
    if (this.store.sortBy() !== column) return '';
    return this.store.sortDir() === 'asc' ? '↑' : '↓';
  }
}
