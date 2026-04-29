import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  DeviationStatus,
  WORKFLOW_STEPS,
  WORKFLOW_STEP_LABELS,
} from '../../../core/models/deviation.model';

@Component({
  selector: 'app-workflow-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-0 overflow-x-auto" role="list" aria-label="Workflow steps">
      @for (step of steps; track step; let i = $index; let last = $last) {
        <div class="flex min-w-0 shrink-0 items-center" role="listitem">
          <!-- Step pill -->
          <div
            class="flex items-center gap-2 rounded-full px-3 py-1.5 text-caption font-medium
                   transition-colors duration-150"
            [class]="stepClass(i)"
          >
            <!-- Step index circle -->
            <span
              class="flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              [class]="indexClass(i)"
            >
              @if (isCompleted(i)) {
                <!-- Check icon -->
                <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                  <path d="M1.5 4l2 2 3-3" stroke="currentColor" stroke-width="1.5"
                        stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
              } @else {
                {{ i + 1 }}
              }
            </span>
            <span class="whitespace-nowrap">{{ labels[step] }}</span>
          </div>

          <!-- Connector -->
          @if (!last) {
            <div
              class="mx-1 h-px w-4 shrink-0 transition-colors duration-150"
              [class]="isCompleted(i) ? 'bg-success' : 'bg-border'"
              aria-hidden="true"
            ></div>
          }
        </div>
      }
    </div>
  `,
})
export class WorkflowStepperComponent {
  readonly currentStatus = input.required<DeviationStatus>();

  protected readonly steps = WORKFLOW_STEPS;
  protected readonly labels = WORKFLOW_STEP_LABELS;

  protected readonly activeIndex = computed(
    () => WORKFLOW_STEPS.indexOf(this.currentStatus()),
  );

  protected isCompleted(i: number): boolean {
    return i < this.activeIndex();
  }

  protected isActive(i: number): boolean {
    return i === this.activeIndex();
  }

  protected stepClass(i: number): string {
    if (this.isCompleted(i)) {
      return 'bg-success/15 text-success';
    }
    if (this.isActive(i)) {
      return 'bg-primary/20 text-primary ring-1 ring-primary/40';
    }
    return 'bg-surface-raised text-text-secondary';
  }

  protected indexClass(i: number): string {
    if (this.isCompleted(i)) {
      return 'bg-success text-white';
    }
    if (this.isActive(i)) {
      return 'bg-primary text-white';
    }
    return 'bg-border text-text-secondary';
  }
}
