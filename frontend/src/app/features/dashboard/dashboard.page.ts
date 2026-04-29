import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { DashboardStore } from './data/dashboard.store';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
  template: `
    <div class="flex flex-col gap-6 p-4 md:p-6">

      <!-- ── Page header ─────────────────────────────────────────── -->
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h1 class="text-heading font-semibold text-balance text-text-primary">
            Dashboard
          </h1>
          <p class="text-caption text-text-secondary">Last 30 days</p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- API Health badge -->
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-3 py-1
                   text-caption font-medium transition-colors duration-150"
            [class]="healthBadgeClass()"
            role="status"
            [attr.aria-label]="'API status: ' + store.healthLabel()"
          >
            <span class="size-1.5 rounded-full" [class]="healthDotClass()" aria-hidden="true"></span>
            API: {{ store.healthLabel() }}
          </span>

          <!-- Export -->
          <button
            class="rounded-lg border border-border bg-surface-raised
                   px-4 py-2 text-body font-medium text-text-primary
                   transition-colors duration-150
                   hover:bg-surface-overlay
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Export
          </button>

          <!-- Add New -->
          <button
            class="rounded-lg bg-primary px-4 py-2 text-body font-medium text-white
                   transition-colors duration-150
                   hover:bg-primary-hover
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Add New
          </button>
        </div>
      </div>

      <!-- ── Metrics cards ──────────────────────────────────────── -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @for (metric of store.metrics(); track metric.title) {
          <div
            class="@container rounded-xl border border-border bg-surface p-4
                   transition-shadow duration-150 hover:shadow-lg hover:shadow-black/20"
          >
            <p class="text-caption font-medium text-text-secondary">{{ metric.title }}</p>
            <p class="mt-1.5 text-[2rem] font-semibold leading-none text-text-primary">
              {{ metric.value }}
            </p>
            <p
              class="mt-1.5 text-caption font-medium"
              [class]="metric.deltaPositive ? 'text-success' : 'text-danger'"
            >
              {{ metric.delta }}
            </p>
          </div>
        }
      </div>

      <!-- ── Charts row ─────────────────────────────────────────── -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">

        <!-- Line chart -->
        <div class="rounded-xl border border-border bg-surface p-4">
          <h2 class="text-body font-semibold text-text-primary">Traffic Over Time</h2>
          <p class="mb-4 mt-1 text-caption text-text-secondary">
            Weekly unique visitors across all channels
          </p>
          <div class="relative h-48">
            <canvas
              baseChart
              [data]="store.lineChartData()"
              [options]="lineChartOptions"
              type="line"
            ></canvas>
          </div>
        </div>

        <!-- Bar chart -->
        <div class="rounded-xl border border-border bg-surface p-4">
          <h2 class="text-body font-semibold text-text-primary">Revenue Breakdown</h2>
          <p class="mb-4 mt-1 text-caption text-text-secondary">
            Monthly revenue in thousands of dollars
          </p>
          <div class="relative h-48">
            <canvas
              baseChart
              [data]="store.barChartData()"
              [options]="barChartOptions"
              type="bar"
            ></canvas>
          </div>
        </div>

      </div>

      <!-- ── Recent activity table ──────────────────────────────── -->
      <div class="overflow-hidden rounded-xl border border-border bg-surface">

        <!-- Table header -->
        <div class="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 class="text-body font-semibold text-text-primary">Recent Activity</h2>
          <p class="text-caption text-text-secondary">
            Showing {{ paginationLabel() }}
          </p>
        </div>

        <!-- Scrollable table -->
        <div class="overflow-x-auto">
          <table class="w-full text-body" role="table">
            <thead>
              <tr class="border-b border-border">
                <th
                  class="px-4 py-3 text-left text-caption font-medium text-text-secondary"
                  scope="col"
                >Name</th>
                <th
                  class="px-4 py-3 text-left text-caption font-medium text-text-secondary"
                  scope="col"
                >Date</th>
                <th
                  class="px-4 py-3 text-left text-caption font-medium text-text-secondary"
                  scope="col"
                >Amount</th>
                <th
                  class="px-4 py-3 text-left text-caption font-medium text-text-secondary"
                  scope="col"
                >Status</th>
                <th
                  class="px-4 py-3 text-left text-caption font-medium text-text-secondary"
                  scope="col"
                >Action</th>
              </tr>
            </thead>
            <tbody>
              @for (row of store.paginatedActivities(); track row.id) {
                <tr
                  class="border-b border-border transition-colors duration-150
                         hover:bg-surface-raised last:border-0"
                >
                  <td class="px-4 py-3 font-medium text-text-primary">{{ row.name }}</td>
                  <td class="px-4 py-3 text-text-secondary">{{ row.date }}</td>
                  <td class="px-4 py-3 text-text-primary">{{ row.amount }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-0.5
                             text-caption font-medium transition-colors duration-150"
                      [class]="badgeClass(row.status)"
                    >
                      {{ row.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-text-secondary">{{ row.action }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between border-t border-border px-4 py-3">
          <span class="text-caption text-text-secondary">
            Page {{ store.currentPage() }} of {{ store.totalPages() }}
          </span>
          <div class="flex items-center gap-2">
            <button
              class="rounded-md border border-border px-3 py-1 text-caption
                     text-text-secondary transition-colors duration-150
                     hover:bg-surface-raised hover:text-text-primary
                     disabled:cursor-not-allowed disabled:opacity-40
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              [disabled]="store.currentPage() === 1"
              (click)="store.goToPage(store.currentPage() - 1)"
            >
              Previous
            </button>
            <button
              class="rounded-md border border-border px-3 py-1 text-caption
                     text-text-secondary transition-colors duration-150
                     hover:bg-surface-raised hover:text-text-primary
                     disabled:cursor-not-allowed disabled:opacity-40
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              [disabled]="store.currentPage() === store.totalPages()"
              (click)="store.goToPage(store.currentPage() + 1)"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class DashboardPage {
  protected readonly store = inject(DashboardStore);

  protected readonly paginationLabel = computed(() => {
    const page = this.store.currentPage();
    const size = this.store.pageSize();
    const total = this.store.allActivities().length;
    const from = (page - 1) * size + 1;
    const to = Math.min(page * size, total);
    return `${from}–${to} of ${total}`;
  });

  protected readonly healthBadgeClass = computed(() => {
    const map: Record<string, string> = {
      success: 'bg-success/15 text-success',
      warning: 'bg-warning/15 text-warning',
      danger: 'bg-danger/15 text-danger',
      neutral: 'bg-surface-raised text-text-secondary',
    };
    return map[this.store.healthBadgeTone()] ?? map['neutral'];
  });

  protected readonly healthDotClass = computed(() => {
    const map: Record<string, string> = {
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-danger',
      neutral: 'bg-text-secondary',
    };
    return map[this.store.healthBadgeTone()] ?? map['neutral'];
  });

  protected badgeClass(status: 'success' | 'warning' | 'danger'): string {
    const map: Record<string, string> = {
      success: 'bg-success/15 text-success',
      warning: 'bg-warning/15 text-warning',
      danger: 'bg-danger/15 text-danger',
    };
    return map[status] ?? '';
  }

  readonly lineChartOptions = DashboardStore.lineChartOptions;
  readonly barChartOptions = DashboardStore.barChartOptions;
}
