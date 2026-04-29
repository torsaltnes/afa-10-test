import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  DeviationSeverity,
  DEVIATION_SEVERITY_LABELS,
} from '../../../core/models/deviation.model';

@Component({
  selector: 'app-severity-badge',
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
export class SeverityBadgeComponent {
  readonly severity = input.required<DeviationSeverity>();

  protected readonly label = computed(
    () => DEVIATION_SEVERITY_LABELS[this.severity()],
  );

  protected readonly badgeClass = computed(() => {
    switch (this.severity()) {
      case 'Critical':
        return 'bg-danger/20 text-danger ring-1 ring-danger/30';
      case 'High':
        return 'bg-danger/10 text-danger';
      case 'Medium':
        return 'bg-warning/15 text-warning';
      case 'Low':
        return 'bg-primary/10 text-primary';
    }
  });
}
