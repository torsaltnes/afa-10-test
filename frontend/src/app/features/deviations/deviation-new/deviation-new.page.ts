import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { take } from 'rxjs/operators';
import { DeviationApiService } from '../../../core/services/deviation-api.service';
import {
  CreateDeviationRequest,
  DEVIATION_SEVERITY_LABELS,
  DEVIATION_TYPE_LABELS,
  DeviationSeverity,
  DeviationType,
} from '../../../core/models/deviation.model';

@Component({
  selector: 'app-deviation-new-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex flex-col gap-6 p-4 md:p-6">

      <!-- ── Page header ─────────────────────────────────────────────────── -->
      <div class="flex items-center gap-4">
        <a
          routerLink="/deviations"
          class="flex size-8 items-center justify-center rounded-lg border border-border
                 text-text-secondary transition-colors duration-150
                 hover:bg-surface-raised hover:text-text-primary
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Back to deviations"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
               stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M9 2L4 7l5 5"/>
          </svg>
        </a>
        <div>
          <h1 class="text-heading font-semibold text-balance text-text-primary">
            Register New Deviation
          </h1>
          <p class="text-caption text-text-secondary">
            Report a deviation, non-conformance, incident, or near miss
          </p>
        </div>
      </div>

      <!-- ── Success state ───────────────────────────────────────────────── -->
      @if (successId()) {
        <div
          class="flex flex-col items-center gap-4 rounded-xl border border-success/30
                 bg-success/10 p-8 text-center"
          role="alert"
        >
          <div
            class="flex size-12 items-center justify-center rounded-full bg-success/20"
            aria-hidden="true"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p class="text-body font-semibold text-success">
            Deviation registered successfully!
          </p>
          <div class="flex gap-3">
            <a
              [routerLink]="['/deviations', successId()]"
              class="rounded-lg bg-primary px-4 py-2 text-body font-medium text-white
                     transition-colors duration-150 hover:bg-primary-hover
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              View Deviation
            </a>
            <a
              routerLink="/deviations"
              class="rounded-lg border border-border px-4 py-2 text-body
                     font-medium text-text-primary transition-colors duration-150
                     hover:bg-surface-raised
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Back to List
            </a>
          </div>
        </div>
      } @else {
        <!-- ── Form ────────────────────────────────────────────────────── -->
        <form
          [formGroup]="form"
          (ngSubmit)="onSubmit()"
          class="flex flex-col gap-6"
          novalidate
        >
          <!-- Card: Basic Information -->
          <div class="rounded-xl border border-border bg-surface p-4 md:p-6">
            <h2 class="mb-4 text-body font-semibold text-text-primary">
              Basic Information
            </h2>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">

              <!-- Title -->
              <div class="md:col-span-2">
                <label
                  for="title"
                  class="mb-1.5 block text-caption font-medium text-text-secondary"
                >
                  Title <span class="text-danger" aria-hidden="true">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  formControlName="title"
                  placeholder="Brief description of the deviation"
                  class="w-full rounded-lg border border-border bg-surface-raised
                         px-3 py-2 text-body text-text-primary
                         placeholder:text-text-secondary transition-colors duration-150
                         focus:border-primary focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary"
                  [class.border-danger]="isInvalid('title')"
                  autocomplete="off"
                />
                @if (isInvalid('title')) {
                  <p class="mt-1 text-caption text-danger" role="alert">
                    Title is required.
                  </p>
                }
              </div>

              <!-- Description -->
              <div class="md:col-span-2">
                <label
                  for="description"
                  class="mb-1.5 block text-caption font-medium text-text-secondary"
                >
                  Description <span class="text-danger" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="description"
                  formControlName="description"
                  rows="4"
                  placeholder="Detailed description of what happened…"
                  class="w-full resize-y rounded-lg border border-border bg-surface-raised
                         px-3 py-2 text-body text-text-primary
                         placeholder:text-text-secondary transition-colors duration-150
                         focus:border-primary focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary"
                  [class.border-danger]="isInvalid('description')"
                ></textarea>
                @if (isInvalid('description')) {
                  <p class="mt-1 text-caption text-danger" role="alert">
                    Description is required (minimum 10 characters).
                  </p>
                }
              </div>

              <!-- Type -->
              <div>
                <label
                  for="type"
                  class="mb-1.5 block text-caption font-medium text-text-secondary"
                >
                  Type <span class="text-danger" aria-hidden="true">*</span>
                </label>
                <select
                  id="type"
                  formControlName="type"
                  class="w-full rounded-lg border border-border bg-surface-raised
                         px-3 py-2 text-body text-text-primary transition-colors duration-150
                         focus:border-primary focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary"
                  [class.border-danger]="isInvalid('type')"
                >
                  <option value="">Select type…</option>
                  @for (opt of typeOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
                @if (isInvalid('type')) {
                  <p class="mt-1 text-caption text-danger" role="alert">
                    Type is required.
                  </p>
                }
              </div>

              <!-- Severity -->
              <div>
                <label
                  for="severity"
                  class="mb-1.5 block text-caption font-medium text-text-secondary"
                >
                  Severity <span class="text-danger" aria-hidden="true">*</span>
                </label>
                <select
                  id="severity"
                  formControlName="severity"
                  class="w-full rounded-lg border border-border bg-surface-raised
                         px-3 py-2 text-body text-text-primary transition-colors duration-150
                         focus:border-primary focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary"
                  [class.border-danger]="isInvalid('severity')"
                >
                  <option value="">Select severity…</option>
                  @for (opt of severityOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
                @if (isInvalid('severity')) {
                  <p class="mt-1 text-caption text-danger" role="alert">
                    Severity is required.
                  </p>
                }
              </div>
            </div>
          </div>

          <!-- Card: Location & Ownership -->
          <div class="rounded-xl border border-border bg-surface p-4 md:p-6">
            <h2 class="mb-4 text-body font-semibold text-text-primary">
              Location &amp; Ownership
            </h2>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">

              <!-- Location -->
              <div>
                <label
                  for="location"
                  class="mb-1.5 block text-caption font-medium text-text-secondary"
                >
                  Location <span class="text-danger" aria-hidden="true">*</span>
                </label>
                <input
                  id="location"
                  type="text"
                  formControlName="location"
                  placeholder="e.g. Warehouse A, Production Floor 2"
                  class="w-full rounded-lg border border-border bg-surface-raised
                         px-3 py-2 text-body text-text-primary
                         placeholder:text-text-secondary transition-colors duration-150
                         focus:border-primary focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary"
                  [class.border-danger]="isInvalid('location')"
                />
                @if (isInvalid('location')) {
                  <p class="mt-1 text-caption text-danger" role="alert">
                    Location is required.
                  </p>
                }
              </div>

              <!-- Department -->
              <div>
                <label
                  for="department"
                  class="mb-1.5 block text-caption font-medium text-text-secondary"
                >
                  Department <span class="text-danger" aria-hidden="true">*</span>
                </label>
                <input
                  id="department"
                  type="text"
                  formControlName="department"
                  placeholder="e.g. Quality, Operations, Maintenance"
                  class="w-full rounded-lg border border-border bg-surface-raised
                         px-3 py-2 text-body text-text-primary
                         placeholder:text-text-secondary transition-colors duration-150
                         focus:border-primary focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary"
                  [class.border-danger]="isInvalid('department')"
                />
                @if (isInvalid('department')) {
                  <p class="mt-1 text-caption text-danger" role="alert">
                    Department is required.
                  </p>
                }
              </div>

              <!-- Reported By -->
              <div>
                <label
                  for="reportedBy"
                  class="mb-1.5 block text-caption font-medium text-text-secondary"
                >
                  Reported By <span class="text-danger" aria-hidden="true">*</span>
                </label>
                <input
                  id="reportedBy"
                  type="text"
                  formControlName="reportedBy"
                  placeholder="Full name of reporter"
                  class="w-full rounded-lg border border-border bg-surface-raised
                         px-3 py-2 text-body text-text-primary
                         placeholder:text-text-secondary transition-colors duration-150
                         focus:border-primary focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary"
                  [class.border-danger]="isInvalid('reportedBy')"
                />
                @if (isInvalid('reportedBy')) {
                  <p class="mt-1 text-caption text-danger" role="alert">
                    Reporter name is required.
                  </p>
                }
              </div>

              <!-- Due Date -->
              <div>
                <label
                  for="dueDate"
                  class="mb-1.5 block text-caption font-medium text-text-secondary"
                >
                  Due Date
                  <span class="ml-1 text-caption text-text-secondary">(optional)</span>
                </label>
                <input
                  id="dueDate"
                  type="date"
                  formControlName="dueDate"
                  class="w-full rounded-lg border border-border bg-surface-raised
                         px-3 py-2 text-body text-text-primary transition-colors duration-150
                         focus:border-primary focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>

          <!-- ── Submit error ───────────────────────────────────────────── -->
          @if (submitError()) {
            <div
              class="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3
                     text-body text-danger"
              role="alert"
            >
              {{ submitError() }}
            </div>
          }

          <!-- ── Actions ────────────────────────────────────────────────── -->
          <div class="flex flex-wrap items-center justify-end gap-3">
            <a
              routerLink="/deviations"
              class="rounded-lg border border-border px-4 py-2 text-body
                     font-medium text-text-primary transition-colors duration-150
                     hover:bg-surface-raised
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Cancel
            </a>
            <button
              type="submit"
              class="flex items-center gap-2 rounded-lg bg-primary px-6 py-2
                     text-body font-medium text-white transition-colors duration-150
                     hover:bg-primary-hover
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                     disabled:cursor-not-allowed disabled:opacity-60"
              [disabled]="submitting()"
            >
              @if (submitting()) {
                <span
                  class="size-4 animate-spin rounded-full border-2 border-white/30
                         border-t-white"
                  aria-hidden="true"
                ></span>
                Registering…
              } @else {
                Register Deviation
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
})
export class DeviationNewPage {
  private readonly api = inject(DeviationApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly successId = signal<string | null>(null);

  protected readonly form: FormGroup = this.fb.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    type: ['', [Validators.required]],
    severity: ['', [Validators.required]],
    location: ['', [Validators.required]],
    department: ['', [Validators.required]],
    reportedBy: ['', [Validators.required]],
    dueDate: [null as string | null],
  });

  protected readonly typeOptions: { value: DeviationType; label: string }[] = [
    { value: 'Deviation', label: DEVIATION_TYPE_LABELS['Deviation'] },
    { value: 'NonConformance', label: DEVIATION_TYPE_LABELS['NonConformance'] },
    { value: 'Incident', label: DEVIATION_TYPE_LABELS['Incident'] },
    { value: 'NearMiss', label: DEVIATION_TYPE_LABELS['NearMiss'] },
  ];

  protected readonly severityOptions: { value: DeviationSeverity; label: string }[] = [
    { value: 'Critical', label: DEVIATION_SEVERITY_LABELS['Critical'] },
    { value: 'High', label: DEVIATION_SEVERITY_LABELS['High'] },
    { value: 'Medium', label: DEVIATION_SEVERITY_LABELS['Medium'] },
    { value: 'Low', label: DEVIATION_SEVERITY_LABELS['Low'] },
  ];

  protected isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.submitError.set(null);

    const val = this.form.value as CreateDeviationRequest & { dueDate: string | null };
    const request: CreateDeviationRequest = {
      title: val.title,
      description: val.description,
      type: val.type as DeviationType,
      severity: val.severity as DeviationSeverity,
      location: val.location,
      department: val.department,
      reportedBy: val.reportedBy,
      dueDate: val.dueDate || null,
    };

    this.api
      .create(request)
      .pipe(take(1))
      .subscribe({
        next: (deviation) => {
          this.submitting.set(false);
          this.successId.set(deviation.id);
        },
        error: (err: Error) => {
          this.submitting.set(false);
          this.submitError.set(
            err?.message ?? 'Failed to register deviation. Please try again.',
          );
        },
      });
  }
}
