import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CreateDeviationPayload,
  DeviationModel,
} from '../../core/models/deviation.model';
import {
  DEVIATION_SEVERITIES,
} from '../../core/models/deviation-severity.type';
import {
  DEVIATION_STATUSES,
} from '../../core/models/deviation-status.type';

@Component({
  selector: 'app-deviation-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form
      [formGroup]="form"
      (ngSubmit)="onSubmit()"
      class="flex flex-col gap-5"
      novalidate
    >
      <!-- Title -->
      <div class="flex flex-col gap-1.5">
        <label for="title" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Title <span class="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="title"
          type="text"
          formControlName="title"
          placeholder="Brief description of the deviation"
          class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                 text-gray-900 placeholder-gray-400 shadow-sm
                 transition-colors duration-150
                 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
                 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100
                 dark:placeholder-gray-500"
        />
        @if (form.controls.title.invalid && form.controls.title.touched) {
          <p class="text-xs text-danger">Title is required.</p>
        }
      </div>

      <!-- Description -->
      <div class="flex flex-col gap-1.5">
        <label for="description" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Description <span class="text-danger" aria-hidden="true">*</span>
        </label>
        <textarea
          id="description"
          formControlName="description"
          rows="3"
          placeholder="Detailed explanation of the deviation"
          class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                 text-gray-900 placeholder-gray-400 shadow-sm
                 transition-colors duration-150
                 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
                 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100
                 dark:placeholder-gray-500"
        ></textarea>
        @if (form.controls.description.invalid && form.controls.description.touched) {
          <p class="text-xs text-danger">Description is required.</p>
        }
      </div>

      <!-- Severity + Status row -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <!-- Severity -->
        <div class="flex flex-col gap-1.5">
          <label for="severity" class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Severity <span class="text-danger" aria-hidden="true">*</span>
          </label>
          <select
            id="severity"
            formControlName="severity"
            class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                   text-gray-900 shadow-sm transition-colors duration-150
                   focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
                   dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            @for (s of severities; track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>
        </div>

        <!-- Status -->
        <div class="flex flex-col gap-1.5">
          <label for="status" class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status <span class="text-danger" aria-hidden="true">*</span>
          </label>
          <select
            id="status"
            formControlName="status"
            class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                   text-gray-900 shadow-sm transition-colors duration-150
                   focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
                   dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            @for (s of statuses; track s) {
              <option [value]="s">{{ s === 'InProgress' ? 'In Progress' : s }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Reported by -->
      <div class="flex flex-col gap-1.5">
        <label for="reportedBy" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Reported by <span class="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="reportedBy"
          type="text"
          formControlName="reportedBy"
          placeholder="Your name or team identifier"
          class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                 text-gray-900 placeholder-gray-400 shadow-sm
                 transition-colors duration-150
                 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
                 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100
                 dark:placeholder-gray-500"
        />
        @if (form.controls.reportedBy.invalid && form.controls.reportedBy.touched) {
          <p class="text-xs text-danger">Reporter is required.</p>
        }
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 border-t border-gray-100 pt-4
                  dark:border-gray-700">
        <button
          type="button"
          (click)="cancelled.emit()"
          class="rounded-md px-4 py-2 text-sm font-medium text-gray-700
                 ring-1 ring-gray-300 transition-colors duration-150
                 hover:bg-gray-50
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          [disabled]="form.invalid || isSaving()"
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white
                 transition-colors duration-150
                 hover:bg-primary-hover
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                 disabled:cursor-not-allowed disabled:opacity-50"
        >
          @if (isSaving()) {
            Saving…
          } @else {
            {{ mode() === 'edit' ? 'Save changes' : 'Create deviation' }}
          }
        </button>
      </div>
    </form>
  `,
})
export class DeviationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly mode = input<'create' | 'edit'>('create');
  readonly initialValue = input<DeviationModel | null>(null);
  readonly isSaving = input<boolean>(false);

  readonly submitted = output<CreateDeviationPayload>();
  readonly cancelled = output<void>();

  readonly severities = DEVIATION_SEVERITIES;
  readonly statuses = DEVIATION_STATUSES;

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    severity: [this.severities[0], Validators.required],
    status: [this.statuses[0], Validators.required],
    reportedBy: ['', Validators.required],
  });

  constructor() {
    // Patch form whenever the initialValue signal changes (e.g. edit mode)
    effect(() => {
      const v = this.initialValue();
      if (v) {
        this.form.patchValue({
          title: v.title,
          description: v.description,
          severity: v.severity,
          status: v.status,
          reportedBy: v.reportedBy,
        });
      }
    });
  }

  ngOnInit(): void {
    if (this.mode() === 'create') {
      this.form.reset({
        title: '',
        description: '',
        severity: 'Low',
        status: 'Open',
        reportedBy: '',
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, description, severity, status, reportedBy } =
      this.form.getRawValue();

    this.submitted.emit({ title, description, severity, status, reportedBy });
  }
}
