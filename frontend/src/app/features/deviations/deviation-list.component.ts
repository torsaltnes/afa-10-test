import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { DeviationModel } from '../../core/models/deviation.model';
import { DeviationSeverityBadgeComponent } from './deviation-severity-badge.component';
import { DeviationStatusBadgeComponent } from './deviation-status-badge.component';

@Component({
  selector: 'app-deviation-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DeviationSeverityBadgeComponent, DeviationStatusBadgeComponent, DatePipe],
  template: `
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-surface
                shadow-sm dark:border-gray-700 dark:bg-surface-dark">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50 dark:border-gray-700
                       dark:bg-gray-800/50">
              <th class="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Title</th>
              <th class="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Severity</th>
              <th class="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
              <th class="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Reported by</th>
              <th class="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Reported at</th>
              <th class="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            @for (deviation of deviations(); track deviation.id) {
              <tr
                class="border-b border-gray-100 transition-colors duration-150
                       last:border-b-0 hover:bg-gray-50
                       dark:border-gray-700/60 dark:hover:bg-gray-800/50"
              >
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-900 dark:text-gray-100">
                    {{ deviation.title }}
                  </p>
                  <p class="mt-0.5 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                    {{ deviation.description }}
                  </p>
                </td>
                <td class="px-4 py-3">
                  <app-deviation-severity-badge [severity]="deviation.severity" />
                </td>
                <td class="px-4 py-3">
                  <app-deviation-status-badge [status]="deviation.status" />
                </td>
                <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {{ deviation.reportedBy }}
                </td>
                <td class="px-4 py-3 tabular-nums text-gray-500 dark:text-gray-400">
                  {{ deviation.reportedAt | date: 'dd MMM yyyy' }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      (click)="editClicked.emit(deviation)"
                      class="rounded px-2.5 py-1 text-xs font-medium text-primary
                             ring-1 ring-primary/40 transition-colors duration-150
                             hover:bg-primary/10
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-primary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      (click)="deleteClicked.emit(deviation.id)"
                      class="rounded px-2.5 py-1 text-xs font-medium text-danger
                             ring-1 ring-danger/40 transition-colors duration-150
                             hover:bg-danger/10
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-danger"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class DeviationListComponent {
  readonly deviations = input.required<DeviationModel[]>();
  readonly editClicked = output<DeviationModel>();
  readonly deleteClicked = output<string>();
}
