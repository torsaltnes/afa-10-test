import { Injectable, computed, inject, signal, DestroyRef } from '@angular/core';
import { EMPTY } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { DeviationApiService } from '../../../core/services/deviation-api.service';
import {
  DeviationDto,
  DeviationListQuery,
  DeviationSeverity,
  DeviationStatus,
  DeviationType,
  PagedResult,
} from '../../../core/models/deviation.model';
import { take } from 'rxjs/operators';

@Injectable()
export class DeviationListStore {
  private readonly api = inject(DeviationApiService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Filter / pagination state ────────────────────────────────────────────
  readonly searchQuery = signal('');
  readonly statusFilter = signal<DeviationStatus | ''>('');
  readonly severityFilter = signal<DeviationSeverity | ''>('');
  readonly typeFilter = signal<DeviationType | ''>('');
  readonly sortBy = signal('createdAt');
  readonly sortDir = signal<'asc' | 'desc'>('desc');
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  // ── Loading / data state ─────────────────────────────────────────────────
  readonly loading = signal(true);
  readonly error = signal<Error | null>(null);
  readonly exportLoading = signal(false);
  private readonly _result = signal<PagedResult<DeviationDto> | null>(null);

  // ── Computed query — tracks all filter signals ───────────────────────────
  private readonly query = computed<DeviationListQuery>(() => ({
    page: this.currentPage(),
    pageSize: this.pageSize(),
    search: this.searchQuery() || undefined,
    status: this.statusFilter() || undefined,
    severity: this.severityFilter() || undefined,
    type: this.typeFilter() || undefined,
    sortBy: this.sortBy(),
    sortDir: this.sortDir(),
  }));

  // ── Derived signals ──────────────────────────────────────────────────────
  readonly items = computed(() => this._result()?.items ?? []);
  readonly totalCount = computed(() => this._result()?.totalCount ?? 0);
  readonly totalPages = computed(() => this._result()?.totalPages ?? 0);

  readonly hasNextPage = computed(() => this.currentPage() < this.totalPages());
  readonly hasPreviousPage = computed(() => this.currentPage() > 1);

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.statusFilter()) count++;
    if (this.severityFilter()) count++;
    if (this.typeFilter()) count++;
    return count;
  });

  readonly paginationLabel = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const total = this.totalCount();
    if (total === 0) return 'No results';
    const from = (page - 1) * size + 1;
    const to = Math.min(page * size, total);
    return `${from}–${to} of ${total}`;
  });

  constructor() {
    // Reactive loading: auto-refetch whenever the query changes.
    // switchMap cancels in-flight requests when the query changes.
    toObservable(this.query)
      .pipe(
        switchMap((query) => {
          this.loading.set(true);
          this.error.set(null);
          return this.api.list(query).pipe(
            catchError((err: Error) => {
              this.error.set(err);
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this._result.set(result);
        this.loading.set(false);
      });
  }

  // ── Actions ──────────────────────────────────────────────────────────────
  setSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  setStatusFilter(status: DeviationStatus | ''): void {
    this.statusFilter.set(status);
    this.currentPage.set(1);
  }

  setSeverityFilter(severity: DeviationSeverity | ''): void {
    this.severityFilter.set(severity);
    this.currentPage.set(1);
  }

  setTypeFilter(type: DeviationType | ''): void {
    this.typeFilter.set(type);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.statusFilter.set('');
    this.severityFilter.set('');
    this.typeFilter.set('');
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  sort(column: string): void {
    if (this.sortBy() === column) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortBy.set(column);
      this.sortDir.set('asc');
    }
    this.currentPage.set(1);
  }

  /** Force a manual re-fetch of the current query (e.g. after an error). */
  reload(): void {
    // Trigger the observable chain by poking a signal it depends on.
    // Simplest: bump currentPage by 0 (toggle a no-op) to force re-emit.
    this.currentPage.update((p) => p);
  }

  export(): void {
    this.exportLoading.set(true);
    this.api
      .exportCsv({
        search: this.searchQuery() || undefined,
        status: this.statusFilter() || undefined,
        severity: this.severityFilter() || undefined,
        type: this.typeFilter() || undefined,
      })
      .pipe(take(1))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `deviations-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          this.exportLoading.set(false);
        },
        error: () => this.exportLoading.set(false),
      });
  }
}
