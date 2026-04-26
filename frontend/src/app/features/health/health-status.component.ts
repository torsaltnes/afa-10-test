import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { inject } from '@angular/core';
import { HealthApiService } from '../../core/services/health-api.service';
import { HealthStatus } from '../../core/models/health-status.model';

@Component({
  selector: 'app-health-status',
  standalone: true,
  imports: [],
  templateUrl: './health-status.component.html',
  styleUrl: './health-status.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HealthStatusComponent {
  private readonly healthApiService = inject(HealthApiService);

  isLoading = signal(false);
  health = signal<HealthStatus | null>(null);
  errorMessage = signal<string | null>(null);

  hasHealthData = computed(() => this.health() !== null);

  runHealthCheck(): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.healthApiService.getHealthStatus().subscribe({
      next: (result) => {
        this.health.set(result);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load health status.';
        this.errorMessage.set(message);
        this.isLoading.set(false);
      }
    });
  }
}
