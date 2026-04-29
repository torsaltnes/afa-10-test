import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  DeviationStatus,
  DEVIATION_STATUS_LABELS,
} from '../../../core/models/deviation.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5
             text-caption font-medium transition-colors duration-150"
      [class]="badgeClass()"
    >
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<DeviationStatus>();

  protected readonly label = computed(
    () => DEVIATION_STATUS_LABELS[this.status()],
  );

  protected readonly badgeClass = computed(() => {
    switch (this.status()) {
      case 'Registered':
        return 'bg-primary/15 text-primary';
      case 'Assessed':
        return 'bg-warning/15 text-warning';
      case 'Investigating':
        return 'bg-warning/20 text-warning';
      case 'CorrectiveAction':
        return 'bg-danger/15 text-danger';
      case 'Closed':
        return 'bg-success/15 text-success';
    }
  });
}
