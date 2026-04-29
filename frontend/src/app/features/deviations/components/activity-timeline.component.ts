import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  TimelineEventDto,
  TimelineEventType,
} from '../../../core/models/deviation.model';

@Component({
  selector: 'app-activity-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (events().length === 0) {
      <div class="py-8 text-center text-body text-text-secondary">
        No activity recorded yet.
      </div>
    } @else {
      <ol class="flex flex-col gap-0" aria-label="Activity timeline">
        @for (event of events(); track event.id; let last = $last) {
          <li class="flex gap-4">
            <!-- Icon column -->
            <div class="flex flex-col items-center">
              <span
                class="flex size-7 shrink-0 items-center justify-center rounded-full
                       ring-2 ring-surface"
                [class]="iconBg(event.eventType)"
                aria-hidden="true"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
                     [class]="iconColor(event.eventType)">
                  @switch (event.eventType) {
                    @case ('Created') {
                      <circle cx="6" cy="6" r="4"/>
                    }
                    @case ('StatusChange') {
                      <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" stroke-width="1.5"
                            stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    }
                    @case ('Comment') {
                      <path d="M1 2h10v6H7l-2 2V8H1V2z" stroke="currentColor"
                            stroke-width="1" fill="none"/>
                    }
                    @case ('AttachmentAdded') {
                      <path d="M7 1v4h4M7 1L11 5v6H1V1h6z" stroke="currentColor"
                            stroke-width="1" fill="none"/>
                    }
                    @case ('AssigneeChanged') {
                      <circle cx="6" cy="4" r="2.5" stroke="currentColor"
                              stroke-width="1" fill="none"/>
                      <path d="M1 10c0-2.5 2-4 5-4s5 1.5 5 4" stroke="currentColor"
                            stroke-width="1" fill="none"/>
                    }
                    @default {
                      <circle cx="6" cy="6" r="3"/>
                    }
                  }
                </svg>
              </span>
              @if (!last) {
                <div class="w-px flex-1 bg-border" aria-hidden="true"></div>
              }
            </div>

            <!-- Content column -->
            <div class="min-w-0 flex-1 pb-6">
              <p class="text-body text-text-primary">{{ event.description }}</p>
              <p class="mt-1 text-caption text-text-secondary">
                {{ event.performedBy }} &middot; {{ formatDate(event.occurredAt) }}
              </p>
            </div>
          </li>
        }
      </ol>
    }
  `,
})
export class ActivityTimelineComponent {
  readonly events = input.required<TimelineEventDto[]>();

  protected iconBg(type: TimelineEventType): string {
    switch (type) {
      case 'Created':
        return 'bg-primary/20';
      case 'StatusChange':
        return 'bg-success/20';
      case 'Comment':
        return 'bg-surface-overlay';
      case 'AttachmentAdded':
        return 'bg-warning/15';
      case 'AssigneeChanged':
        return 'bg-surface-overlay';
      default:
        return 'bg-surface-overlay';
    }
  }

  protected iconColor(type: TimelineEventType): string {
    switch (type) {
      case 'Created':
        return 'text-primary';
      case 'StatusChange':
        return 'text-success';
      case 'Comment':
        return 'text-text-secondary';
      case 'AttachmentAdded':
        return 'text-warning';
      case 'AssigneeChanged':
        return 'text-text-secondary';
      default:
        return 'text-text-secondary';
    }
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
}
