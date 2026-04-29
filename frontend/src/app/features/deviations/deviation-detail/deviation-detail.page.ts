import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DeviationDetailStore, DetailTab } from '../data/deviation-detail.store';
import { SeverityBadgeComponent } from '../components/severity-badge.component';
import { StatusBadgeComponent } from '../components/status-badge.component';
import { WorkflowStepperComponent } from '../components/workflow-stepper.component';
import { ActivityTimelineComponent } from '../components/activity-timeline.component';
import { AttachmentsPanelComponent } from '../components/attachments-panel.component';
import {
  DEVIATION_TYPE_LABELS,
  NEXT_STATUS_LABELS,
} from '../../../core/models/deviation.model';

@Component({
  selector: 'app-deviation-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DeviationDetailStore],
  imports: [
    RouterLink,
    FormsModule,
    SeverityBadgeComponent,
    StatusBadgeComponent,
    WorkflowStepperComponent,
    ActivityTimelineComponent,
    AttachmentsPanelComponent,
  ],
  template: `
    <div class="flex flex-col gap-6 p-4 md:p-6">

      <!-- ── Back nav ────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-3">
        <a
          routerLink="/deviations"
          class="flex size-8 items-center justify-center rounded-lg border border-border
                 text-text-secondary transition-colors duration-150
                 hover:bg-surface-raised hover:text-text-primary
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Back to deviations list"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
               stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M9 2L4 7l5 5"/>
          </svg>
        </a>
        <span class="text-caption text-text-secondary">Deviations</span>
        @if (store.deviation()) {
          <span class="text-caption text-text-secondary">/</span>
          <span class="font-mono text-caption text-text-secondary">
            {{ store.deviation()!.referenceNumber }}
          </span>
        }
      </div>

      <!-- ── Loading state ────────────────────────────────────────────────── -->
      @if (store.loading()) {
        <div class="flex flex-col gap-4">
          @for (_ of [1,2,3]; track $index) {
            <div class="animate-pulse rounded-xl border border-border bg-surface p-6">
              <div class="flex flex-col gap-3">
                <div class="h-5 w-48 rounded-full bg-surface-raised"></div>
                <div class="h-3 w-full rounded-full bg-surface-raised"></div>
                <div class="h-3 w-3/4 rounded-full bg-surface-raised"></div>
              </div>
            </div>
          }
        </div>
      } @else if (!store.deviation()) {
        <!-- Not found / error -->
        <div class="flex flex-col items-center gap-4 rounded-xl border border-border
                    bg-surface py-12 text-center">
          <p class="text-body font-medium text-text-primary">Deviation not found</p>
          <a
            routerLink="/deviations"
            class="rounded-lg bg-primary px-4 py-2 text-body font-medium text-white
                   transition-colors duration-150 hover:bg-primary-hover
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Back to List
          </a>
        </div>
      } @else {
        <!-- ── Main content ─────────────────────────────────────────────── -->
        @let dev = store.deviation()!;

        <!-- Header card -->
        <div class="overflow-hidden rounded-xl border border-border bg-surface">
          <div class="flex flex-wrap items-start justify-between gap-4 p-4 md:p-6">
            <div class="flex min-w-0 flex-col gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-caption text-text-secondary">
                  {{ dev.referenceNumber }}
                </span>
                <app-severity-badge [severity]="dev.severity" />
                <app-status-badge [status]="dev.status" />
              </div>
              <h1 class="text-heading font-semibold text-balance text-text-primary">
                {{ dev.title }}
              </h1>
              <p class="text-body text-text-secondary">
                {{ dev.description }}
              </p>
            </div>

            <!-- Advance workflow button -->
            @if (store.canAdvance()) {
              <div class="flex shrink-0 flex-col items-end gap-2">
                <button
                  class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2
                         text-body font-medium text-white transition-colors duration-150
                         hover:bg-primary-hover
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                         disabled:cursor-not-allowed disabled:opacity-60"
                  [disabled]="store.advancingWorkflow()"
                  (click)="openAdvancePanel()"
                  type="button"
                >
                  @if (store.advancingWorkflow()) {
                    <span
                      class="size-4 animate-spin rounded-full border-2
                             border-white/30 border-t-white"
                      aria-hidden="true"
                    ></span>
                    Advancing…
                  } @else {
                    {{ nextStepLabel() }}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                         stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                      <path d="M5 2l5 5-5 5"/>
                    </svg>
                  }
                </button>
                @if (store.workflowError()) {
                  <p class="text-caption text-danger" role="alert">
                    {{ store.workflowError() }}
                  </p>
                }
              </div>
            }
          </div>

          <!-- Stepper -->
          <div class="border-t border-border px-4 py-3 md:px-6">
            <app-workflow-stepper [currentStatus]="dev.status" />
          </div>
        </div>

        <!-- Advance workflow panel (inline) -->
        @if (showAdvancePanel()) {
          <div
            class="rounded-xl border border-primary/30 bg-surface p-4 md:p-6"
            role="region"
            aria-label="Advance workflow"
          >
            <h2 class="mb-4 text-body font-semibold text-text-primary">
              {{ nextStepLabel() }}
            </h2>
            <div class="flex flex-col gap-4">
              <!-- Notes -->
              <div>
                <label
                  for="advanceNotes"
                  class="mb-1.5 block text-caption font-medium text-text-secondary"
                >
                  Notes <span class="text-danger" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="advanceNotes"
                  [(ngModel)]="advanceNotes"
                  rows="3"
                  placeholder="Describe actions taken or findings…"
                  class="w-full resize-y rounded-lg border border-border bg-surface-raised
                         px-3 py-2 text-body text-text-primary
                         placeholder:text-text-secondary transition-colors duration-150
                         focus:border-primary focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary"
                ></textarea>
              </div>
              <!-- Assignee -->
              <div>
                <label
                  for="advanceAssignee"
                  class="mb-1.5 block text-caption font-medium text-text-secondary"
                >
                  Assign To
                  <span class="ml-1 text-caption text-text-secondary">(optional)</span>
                </label>
                <input
                  id="advanceAssignee"
                  type="text"
                  [(ngModel)]="advanceAssignee"
                  placeholder="Name of assignee"
                  class="w-full rounded-lg border border-border bg-surface-raised
                         px-3 py-2 text-body text-text-primary
                         placeholder:text-text-secondary transition-colors duration-150
                         focus:border-primary focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <!-- Actions -->
              <div class="flex gap-3">
                <button
                  class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2
                         text-body font-medium text-white transition-colors duration-150
                         hover:bg-primary-hover
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                         disabled:cursor-not-allowed disabled:opacity-60"
                  [disabled]="!advanceNotes.trim() || store.advancingWorkflow()"
                  (click)="confirmAdvance()"
                  type="button"
                >
                  Confirm
                </button>
                <button
                  class="rounded-lg border border-border px-4 py-2 text-body
                         font-medium text-text-primary transition-colors duration-150
                         hover:bg-surface-raised
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  (click)="closeAdvancePanel()"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        }

        <!-- ── Tabs ─────────────────────────────────────────────────────── -->
        <div class="overflow-hidden rounded-xl border border-border bg-surface">

          <!-- Tab bar -->
          <div
            class="flex border-b border-border"
            role="tablist"
            aria-label="Deviation details tabs"
          >
            @for (tab of tabs; track tab.id) {
              <button
                class="relative px-5 py-3 text-body font-medium transition-colors duration-150
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset
                       focus-visible:ring-primary"
                [class]="store.activeTab() === tab.id
                  ? 'text-text-primary after:absolute after:bottom-0 after:left-0
                     after:right-0 after:h-0.5 after:bg-primary'
                  : 'text-text-secondary hover:text-text-primary'"
                role="tab"
                [attr.aria-selected]="store.activeTab() === tab.id"
                [attr.id]="'tab-' + tab.id"
                [attr.aria-controls]="'panel-' + tab.id"
                (click)="store.setActiveTab(tab.id)"
                type="button"
              >
                {{ tab.label }}
                @if (tab.id === 'attachments' && dev.attachmentCount > 0) {
                  <span
                    class="ml-2 rounded-full bg-surface-raised px-1.5 py-0.5
                           text-[10px] font-bold text-text-secondary"
                  >
                    {{ dev.attachmentCount }}
                  </span>
                }
              </button>
            }
          </div>

          <!-- Tab panels -->
          <div class="p-4 md:p-6">

            <!-- Details tab -->
            @if (store.activeTab() === 'details') {
              <div
                role="tabpanel"
                id="panel-details"
                aria-labelledby="tab-details"
              >
                <dl class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div class="flex flex-col gap-0.5">
                    <dt class="text-caption font-medium text-text-secondary">Reference</dt>
                    <dd class="font-mono text-body text-text-primary">
                      {{ dev.referenceNumber }}
                    </dd>
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <dt class="text-caption font-medium text-text-secondary">Type</dt>
                    <dd class="text-body text-text-primary">{{ typeLabel(dev) }}</dd>
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <dt class="text-caption font-medium text-text-secondary">Severity</dt>
                    <dd><app-severity-badge [severity]="dev.severity" /></dd>
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <dt class="text-caption font-medium text-text-secondary">Status</dt>
                    <dd><app-status-badge [status]="dev.status" /></dd>
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <dt class="text-caption font-medium text-text-secondary">Location</dt>
                    <dd class="text-body text-text-primary">{{ dev.location }}</dd>
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <dt class="text-caption font-medium text-text-secondary">Department</dt>
                    <dd class="text-body text-text-primary">{{ dev.department }}</dd>
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <dt class="text-caption font-medium text-text-secondary">Reported By</dt>
                    <dd class="text-body text-text-primary">{{ dev.reportedBy }}</dd>
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <dt class="text-caption font-medium text-text-secondary">Assigned To</dt>
                    <dd class="text-body text-text-primary">
                      {{ dev.assignedTo ?? '—' }}
                    </dd>
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <dt class="text-caption font-medium text-text-secondary">Created</dt>
                    <dd class="text-body text-text-primary">
                      {{ formatDate(dev.createdAt) }}
                    </dd>
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <dt class="text-caption font-medium text-text-secondary">Last Updated</dt>
                    <dd class="text-body text-text-primary">
                      {{ formatDate(dev.updatedAt) }}
                    </dd>
                  </div>
                  @if (dev.dueDate) {
                    <div class="flex flex-col gap-0.5">
                      <dt class="text-caption font-medium text-text-secondary">Due Date</dt>
                      <dd class="text-body text-text-primary">
                        {{ formatDate(dev.dueDate) }}
                      </dd>
                    </div>
                  }
                  @if (dev.closedAt) {
                    <div class="flex flex-col gap-0.5">
                      <dt class="text-caption font-medium text-text-secondary">Closed At</dt>
                      <dd class="text-body text-success">
                        {{ formatDate(dev.closedAt) }}
                      </dd>
                    </div>
                  }
                </dl>
              </div>
            }

            <!-- Timeline tab -->
            @if (store.activeTab() === 'timeline') {
              <div
                role="tabpanel"
                id="panel-timeline"
                aria-labelledby="tab-timeline"
              >
                @if (store.timelineLoading()) {
                  <div class="flex justify-center py-8">
                    <span
                      class="size-6 animate-spin rounded-full border-2
                             border-border border-t-primary"
                      aria-label="Loading timeline"
                    ></span>
                  </div>
                } @else {
                  <app-activity-timeline [events]="store.timeline()" />
                }
              </div>
            }

            <!-- Attachments tab -->
            @if (store.activeTab() === 'attachments') {
              <div
                role="tabpanel"
                id="panel-attachments"
                aria-labelledby="tab-attachments"
              >
                @if (store.attachmentsLoading()) {
                  <div class="flex justify-center py-8">
                    <span
                      class="size-6 animate-spin rounded-full border-2
                             border-border border-t-primary"
                      aria-label="Loading attachments"
                    ></span>
                  </div>
                } @else {
                  <app-attachments-panel
                    [attachments]="store.attachments()"
                    [uploading]="store.uploadingAttachment()"
                    [deletingId]="store.deletingAttachmentId()"
                    (fileSelected)="store.uploadAttachment($event)"
                    (deleteRequest)="store.deleteAttachment($event)"
                  />
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DeviationDetailPage implements OnInit {
  protected readonly store = inject(DeviationDetailStore);
  private readonly route = inject(ActivatedRoute);

  protected readonly showAdvancePanel = signal(false);
  protected advanceNotes = '';
  protected advanceAssignee = '';

  protected readonly tabs: { id: DetailTab; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'timeline', label: 'Activity Timeline' },
    { id: 'attachments', label: 'Attachments' },
  ];

  protected readonly nextStepLabel = computed(() => {
    const status = this.store.deviation()?.status;
    if (!status) return '';
    return NEXT_STATUS_LABELS[status] ?? '';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.setId(id);
    }
  }

  protected openAdvancePanel(): void {
    this.advanceNotes = '';
    this.advanceAssignee = '';
    this.showAdvancePanel.set(true);
  }

  protected closeAdvancePanel(): void {
    this.showAdvancePanel.set(false);
  }

  protected confirmAdvance(): void {
    if (!this.advanceNotes.trim()) return;
    this.store.advanceWorkflow({
      notes: this.advanceNotes.trim(),
      assignedTo: this.advanceAssignee.trim() || null,
    });
    this.showAdvancePanel.set(false);
    this.advanceNotes = '';
    this.advanceAssignee = '';
  }

  protected typeLabel(dev: { type: string }): string {
    return DEVIATION_TYPE_LABELS[dev.type as keyof typeof DEVIATION_TYPE_LABELS] ?? dev.type;
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
}
