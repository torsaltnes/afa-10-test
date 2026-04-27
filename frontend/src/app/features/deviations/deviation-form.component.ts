import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Deviation, DEVIATION_SEVERITIES, DEVIATION_STATUSES, UpsertDeviationRequest } from '../../core/models/deviation.model';

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

      <!-- ── Title ──────────────────────────────────────────────────────── -->
      <div class="flex flex-col gap-1.5">
        <label for="dev-title" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Title <span class="text-danger" aria-hidden="true">*</span>
        </label>

        <input
          id="dev-title"
          type="text"
          formControlName="title"
          autocomplete="off"
          class="w-full rounded-md border px-3 py-2 text-sm
                 bg-white text-gray-900 placeholder-gray-400
                 transition-colors duration-150
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          [class.border-gray-300]="!(form.controls.title.invalid && form.controls.title.touched)"
          [class.border-danger]="form.controls.title.invalid && form.controls.title.touched"
          [class.dark:border-gray-600]="!(form.controls.title.invalid && form.controls.title.touched)"
          [class.dark:border-danger]="form.controls.title.invalid && form.controls.title.touched"
          [attr.aria-invalid]="(form.controls.title.invalid && form.controls.title.touched) ? 'true' : null"
          [attr.aria-describedby]="(form.controls.title.invalid && form.controls.title.touched) ? 'dev-title-error' : null"
          placeholder="Brief title of the deviation"
        />

        @if (form.controls.title.invalid && form.controls.title.touched) {
          <p
            id="dev-title-error"
            class="flex items-center gap-1 text-xs text-danger"
            role="alert"
          >
            <!-- Inline warning icon -->
            <svg class="size-3 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75
                       1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457
                       1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0
                       00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z"/>
            </svg>
            Title is required.
          </p>
        }
      </div>

      <!-- ── Description ────────────────────────────────────────────────── -->
      <div class="flex flex-col gap-1.5">
        <label for="dev-desc" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Description <span class="text-danger" aria-hidden="true">*</span>
        </label>

        <textarea
          id="dev-desc"
          formControlName="description"
          rows="4"
          class="w-full resize-none rounded-md border px-3 py-2 text-sm
                 bg-white text-gray-900 placeholder-gray-400
                 transition-colors duration-150
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          [class.border-gray-300]="!(form.controls.description.invalid && form.controls.description.touched)"
          [class.border-danger]="form.controls.description.invalid && form.controls.description.touched"
          [class.dark:border-gray-600]="!(form.controls.description.invalid && form.controls.description.touched)"
          [class.dark:border-danger]="form.controls.description.invalid && form.controls.description.touched"
          [attr.aria-invalid]="(form.controls.description.invalid && form.controls.description.touched) ? 'true' : null"
          [attr.aria-describedby]="(form.controls.description.invalid && form.controls.description.touched) ? 'dev-desc-error' : null"
          placeholder="Detailed description of the non-conformity"
        ></textarea>

        @if (form.controls.description.invalid && form.controls.description.touched) {
          <p
            id="dev-desc-error"
            class="flex items-center gap-1 text-xs text-danger"
            role="alert"
          >
            <svg class="size-3 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75
                       1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457
                       1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0
                       00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z"/>
            </svg>
            Description is required.
          </p>
        }
      </div>

      <!-- ── Severity + Status (side-by-side on sm+) ───────────────────── -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <!-- Severity -->
        <div class="flex flex-col gap-1.5">
          <label for="dev-severity" class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Severity <span class="text-danger" aria-hidden="true">*</span>
          </label>
          <select
            id="dev-severity"
            formControlName="severity"
            class="field-select w-full cursor-pointer rounded-md border border-gray-300
                   bg-white px-3 py-2 text-sm text-gray-900
                   transition-colors duration-150
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                   dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            @for (s of severities; track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>
        </div>

        <!-- Status (edit mode only — occupies second column) -->
        @if (mode() === 'edit') {
          <div class="flex flex-col gap-1.5">
            <label for="dev-status" class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              id="dev-status"
              formControlName="status"
              class="field-select w-full cursor-pointer rounded-md border border-gray-300
                     bg-white px-3 py-2 text-sm text-gray-900
                     transition-colors duration-150
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                     dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              @for (s of statuses; track s) {
                <option [value]="s">{{ s }}</option>
              }
            </select>
          </div>
        }

      </div>

      <!-- ── Actions ────────────────────────────────────────────────────── -->
      <div
        class="flex items-center gap-3 border-t border-gray-100 pt-4
               dark:border-gray-700"
      >
        <!-- Submit -->
        <button
          type="submit"
          [disabled]="saving()"
          class="inline-flex items-center gap-1.5 rounded-md bg-primary
                 px-4 py-2 text-sm font-medium text-white
                 transition-colors duration-150 hover:bg-primary-hover
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-primary focus-visible:ring-offset-2
                 disabled:cursor-not-allowed disabled:opacity-60"
        >
          @if (saving()) {
            <!-- Animated spinner while saving -->
            <svg
              class="size-4 animate-spin shrink-0"
              viewBox="0 0 24 24" fill="none" aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor"
                      stroke-width="4" class="opacity-25"/>
              <path fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    class="opacity-75"/>
            </svg>
            Saving…
          } @else if (mode() === 'create') {
            Create Deviation
          } @else {
            Save Changes
          }
        </button>

        <!-- Cancel -->
        <button
          type="button"
          (click)="onCancel()"
          class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium
                 text-gray-700 transition-colors duration-150
                 hover:border-gray-400 hover:bg-gray-50
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-primary focus-visible:ring-offset-2
                 dark:border-gray-600 dark:text-gray-300
                 dark:hover:border-gray-500 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>

    </form>
  `,
})
export class DeviationFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly initialValue = input<Deviation | null>(null);
  readonly mode = input<'create' | 'edit'>('create');
  readonly saving = input<boolean>(false);

  readonly submitted = output<UpsertDeviationRequest>();
  readonly cancelled = output<void>();

  protected readonly severities = DEVIATION_SEVERITIES;
  protected readonly statuses = DEVIATION_STATUSES;

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    severity: ['Low' as string, Validators.required],
    status: ['Open' as string],
  });

  constructor() {
    // React to initialValue / mode changes and patch the form.
    effect(() => {
      const value = this.initialValue();
      const m = this.mode();
      if (m === 'create' || value === null) {
        this.form.reset({ title: '', description: '', severity: 'Low', status: 'Open' });
      } else {
        this.form.patchValue({
          title: value.title,
          description: value.description,
          severity: value.severity,
          status: value.status,
        });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { title, description, severity, status } = this.form.getRawValue();
    const request: UpsertDeviationRequest = {
      title: title.trim(),
      description: description.trim(),
      severity: severity as UpsertDeviationRequest['severity'],
      status: this.mode() === 'edit' ? (status as UpsertDeviationRequest['status']) : undefined,
    };
    this.submitted.emit(request);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
