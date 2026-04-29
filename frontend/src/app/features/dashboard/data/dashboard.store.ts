import { Injectable, computed, inject, resource, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ChartData, ChartOptions } from 'chart.js';
import { HealthApiService } from '../../../core/services/health-api.service';
import { HealthStatusDto } from '../../../core/models/health-status.model';

export interface MetricCard {
  title: string;
  value: string;
  delta: string;
  deltaPositive: boolean;
  iconId: string;
}

export interface ActivityRow {
  id: number;
  name: string;
  date: string;
  amount: string;
  status: 'success' | 'warning' | 'danger';
  action: string;
}

const SEEDED_METRICS: MetricCard[] = [
  {
    title: 'Total Users',
    value: '12,489',
    delta: '+4.6%',
    deltaPositive: true,
    iconId: 'users',
  },
  {
    title: 'Revenue',
    value: '$48,293',
    delta: '+12.3%',
    deltaPositive: true,
    iconId: 'dollar',
  },
  {
    title: 'Active Sessions',
    value: '1,234',
    delta: '-2.1%',
    deltaPositive: false,
    iconId: 'activity',
  },
  {
    title: 'Conversion Rate',
    value: '3.6%',
    delta: '+0.4%',
    deltaPositive: true,
    iconId: 'percent',
  },
];

const SEEDED_ACTIVITIES: ActivityRow[] = [
  {
    id: 1,
    name: 'Alice Johnson',
    date: '2026-04-29',
    amount: '$1,240',
    status: 'success',
    action: 'Purchase',
  },
  {
    id: 2,
    name: 'Bob Smith',
    date: '2026-04-28',
    amount: '$320',
    status: 'warning',
    action: 'Refund',
  },
  {
    id: 3,
    name: 'Carol Davis',
    date: '2026-04-28',
    amount: '$4,800',
    status: 'success',
    action: 'Purchase',
  },
  {
    id: 4,
    name: 'David Wilson',
    date: '2026-04-27',
    amount: '$190',
    status: 'danger',
    action: 'Chargeback',
  },
  {
    id: 5,
    name: 'Eva Martinez',
    date: '2026-04-27',
    amount: '$2,100',
    status: 'success',
    action: 'Purchase',
  },
  {
    id: 6,
    name: 'Frank Lee',
    date: '2026-04-26',
    amount: '$780',
    status: 'warning',
    action: 'Dispute',
  },
  {
    id: 7,
    name: 'Grace Chen',
    date: '2026-04-26',
    amount: '$3,450',
    status: 'success',
    action: 'Purchase',
  },
  {
    id: 8,
    name: 'Henry Park',
    date: '2026-04-25',
    amount: '$560',
    status: 'danger',
    action: 'Chargeback',
  },
];

const CHART_COL_1 = 'oklch(0.62 0.19 264)';
const CHART_COL_2 = 'oklch(0.72 0.17 145)';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly healthApi = inject(HealthApiService);

  // ── Seeded static data ───────────────────────────────────────
  readonly metrics = signal<MetricCard[]>(SEEDED_METRICS);
  readonly allActivities = signal<ActivityRow[]>(SEEDED_ACTIVITIES);

  readonly lineChartData = signal<ChartData<'line'>>({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Visitors',
        data: [1200, 1900, 1500, 2100, 1800, 2400, 2200],
        borderColor: CHART_COL_1,
        backgroundColor: 'oklch(0.62 0.19 264 / 0.15)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: CHART_COL_1,
      },
    ],
  });

  readonly barChartData = signal<ChartData<'bar'>>({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue ($k)',
        data: [4.2, 5.8, 4.9, 7.2, 6.1, 8.4],
        backgroundColor: 'oklch(0.72 0.17 145 / 0.75)',
        borderColor: CHART_COL_2,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  });

  // ── Pagination ───────────────────────────────────────────────
  readonly currentPage = signal(1);
  readonly pageSize = signal(5);

  readonly totalPages = computed(() =>
    Math.ceil(this.allActivities().length / this.pageSize()),
  );

  readonly paginatedActivities = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    return this.allActivities().slice((page - 1) * size, page * size);
  });

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  // ── Health check resource ────────────────────────────────────
  /** Async resource backed by the backend /health endpoint. */
  readonly healthResource = resource<HealthStatusDto, void>({
    loader: () => lastValueFrom(this.healthApi.getHealthStatus()),
  });

  readonly isApiHealthy = computed(() => {
    const s = this.healthResource.value()?.status;
    return s === 'Healthy' || s === 'Degraded';
  });

  /** Derives a semantic badge tone from the current health status. */
  readonly healthBadgeTone = computed(
    (): 'success' | 'warning' | 'danger' | 'neutral' => {
      if (this.healthResource.isLoading()) return 'neutral';
      const status = this.healthResource.value()?.status;
      if (status === 'Healthy') return 'success';
      if (status === 'Degraded') return 'warning';
      if (status === 'Unhealthy') return 'danger';
      return 'neutral';
    },
  );

  readonly healthLabel = computed(() => {
    if (this.healthResource.isLoading()) return 'Checking…';
    const status = this.healthResource.value()?.status;
    return status ?? 'Unavailable';
  });

  // Re-export chart options type for the page component
  static readonly lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'oklch(0.26 0.025 264)',
        titleColor: 'oklch(0.94 0.005 264)',
        bodyColor: 'oklch(0.65 0.01 264)',
        borderColor: 'oklch(0.30 0.02 264)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: 'oklch(0.30 0.02 264 / 0.5)' },
        ticks: { color: 'oklch(0.65 0.01 264)', font: { size: 11 } },
      },
      y: {
        grid: { color: 'oklch(0.30 0.02 264 / 0.5)' },
        ticks: { color: 'oklch(0.65 0.01 264)', font: { size: 11 } },
      },
    },
  };

  static readonly barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'oklch(0.26 0.025 264)',
        titleColor: 'oklch(0.94 0.005 264)',
        bodyColor: 'oklch(0.65 0.01 264)',
        borderColor: 'oklch(0.30 0.02 264)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: 'oklch(0.30 0.02 264 / 0.5)' },
        ticks: { color: 'oklch(0.65 0.01 264)', font: { size: 11 } },
      },
      y: {
        grid: { color: 'oklch(0.30 0.02 264 / 0.5)' },
        ticks: { color: 'oklch(0.65 0.01 264)', font: { size: 11 } },
      },
    },
  };
}
