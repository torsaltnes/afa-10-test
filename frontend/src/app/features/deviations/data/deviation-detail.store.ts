import { Injectable, computed, inject, signal } from '@angular/core';
import { take } from 'rxjs/operators';
import { DeviationApiService } from '../../../core/services/deviation-api.service';
import {
  AdvanceWorkflowRequest,
  AttachmentDto,
  DeviationDto,
  TimelineEventDto,
  WORKFLOW_STEPS,
} from '../../../core/models/deviation.model';

export type DetailTab = 'details' | 'timeline' | 'attachments';

@Injectable()
export class DeviationDetailStore {
  private readonly api = inject(DeviationApiService);

  // ── Identity ─────────────────────────────────────────────────────────────
  readonly deviationId = signal<string | null>(null);
  readonly activeTab = signal<DetailTab>('details');

  // ── Deviation data ────────────────────────────────────────────────────────
  readonly loading = signal(false);
  readonly deviation = signal<DeviationDto | null>(null);

  // ── Timeline data ─────────────────────────────────────────────────────────
  readonly timelineLoading = signal(false);
  readonly timeline = signal<TimelineEventDto[]>([]);
  private timelineLoaded = false;

  // ── Attachments data ──────────────────────────────────────────────────────
  readonly attachmentsLoading = signal(false);
  readonly attachments = signal<AttachmentDto[]>([]);
  private attachmentsLoaded = false;

  // ── Mutation state ────────────────────────────────────────────────────────
  readonly advancingWorkflow = signal(false);
  readonly workflowError = signal<string | null>(null);
  readonly uploadingAttachment = signal(false);
  readonly deletingAttachmentId = signal<string | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  readonly workflowStepIndex = computed(() => {
    const status = this.deviation()?.status;
    return status != null ? WORKFLOW_STEPS.indexOf(status) : -1;
  });

  readonly canAdvance = computed(
    () => this.deviation()?.status != null && this.deviation()?.status !== 'Closed',
  );

  // ── Actions ───────────────────────────────────────────────────────────────
  setId(id: string): void {
    this.deviationId.set(id);
    this.timelineLoaded = false;
    this.attachmentsLoaded = false;
    this.loadDeviation(id);
  }

  setActiveTab(tab: DetailTab): void {
    this.activeTab.set(tab);
    const id = this.deviationId();
    if (!id) return;

    if (tab === 'timeline' && !this.timelineLoaded) {
      this.loadTimeline(id);
    }
    if (tab === 'attachments' && !this.attachmentsLoaded) {
      this.loadAttachments(id);
    }
  }

  advanceWorkflow(request: AdvanceWorkflowRequest): void {
    const id = this.deviationId();
    if (!id) return;
    this.advancingWorkflow.set(true);
    this.workflowError.set(null);
    this.api
      .advance(id, request)
      .pipe(take(1))
      .subscribe({
        next: (updated) => {
          this.deviation.set(updated);
          this.advancingWorkflow.set(false);
          // Refresh timeline if it was loaded
          if (this.timelineLoaded) {
            this.loadTimeline(id);
          }
        },
        error: (err: Error) => {
          this.workflowError.set(err?.message ?? 'Failed to advance workflow');
          this.advancingWorkflow.set(false);
        },
      });
  }

  uploadAttachment(file: File): void {
    const id = this.deviationId();
    if (!id) return;
    this.uploadingAttachment.set(true);
    this.api
      .uploadAttachment(id, file)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.uploadingAttachment.set(false);
          this.loadAttachments(id);
          this.reloadDeviation(id); // refresh attachmentCount
        },
        error: () => this.uploadingAttachment.set(false),
      });
  }

  deleteAttachment(attachmentId: string): void {
    const id = this.deviationId();
    if (!id) return;
    this.deletingAttachmentId.set(attachmentId);
    this.api
      .deleteAttachment(id, attachmentId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.deletingAttachmentId.set(null);
          this.loadAttachments(id);
          this.reloadDeviation(id); // refresh attachmentCount
        },
        error: () => this.deletingAttachmentId.set(null),
      });
  }

  // ── Private loaders ───────────────────────────────────────────────────────
  private loadDeviation(id: string): void {
    this.loading.set(true);
    this.api
      .getById(id)
      .pipe(take(1))
      .subscribe({
        next: (dev) => {
          this.deviation.set(dev);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private reloadDeviation(id: string): void {
    this.api
      .getById(id)
      .pipe(take(1))
      .subscribe({ next: (dev) => this.deviation.set(dev) });
  }

  private loadTimeline(id: string): void {
    this.timelineLoading.set(true);
    this.api
      .getTimeline(id)
      .pipe(take(1))
      .subscribe({
        next: (events) => {
          this.timeline.set(events);
          this.timelineLoading.set(false);
          this.timelineLoaded = true;
        },
        error: () => this.timelineLoading.set(false),
      });
  }

  private loadAttachments(id: string): void {
    this.attachmentsLoading.set(true);
    this.attachmentsLoaded = false;
    this.api
      .getAttachments(id)
      .pipe(take(1))
      .subscribe({
        next: (list) => {
          this.attachments.set(list);
          this.attachmentsLoading.set(false);
          this.attachmentsLoaded = true;
        },
        error: () => this.attachmentsLoading.set(false),
      });
  }
}
