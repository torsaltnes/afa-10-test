import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DeviationSeverity } from '../../core/models/deviation-severity.type';

@Component({
  selector: 'app-deviation-severity-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5
             text-xs font-medium select-none transition-colors duration-150"
      [class]="badgeClass()"
    >
      <span class="size-1.5 rounded-full bg-current opacity-75" aria-hidden="true"></span>
      {{ severity() }}
    </span>
  `,
})
export class DeviationSeverityBadgeComponent {
  readonly severity = input.required<DeviationSeverity>();

  readonly badgeClass = computed(() => {
    switch (this.severity()) {
      case 'Critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'High':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'Low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  });
}
