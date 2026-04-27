import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DeviationStatus } from '../../core/models/deviation-status.type';

@Component({
  selector: 'app-deviation-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5
             text-xs font-medium select-none transition-colors duration-150"
      [class]="badgeClass()"
    >
      <span class="size-1.5 rounded-full bg-current opacity-75" aria-hidden="true"></span>
      {{ label() }}
    </span>
  `,
})
export class DeviationStatusBadgeComponent {
  readonly status = input.required<DeviationStatus>();

  readonly label = computed(() => {
    switch (this.status()) {
      case 'InProgress':
        return 'In Progress';
      default:
        return this.status();
    }
  });

  readonly badgeClass = computed(() => {
    switch (this.status()) {
      case 'Open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'InProgress':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'Resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Closed':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  });
}
