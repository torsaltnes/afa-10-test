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
import { CourseEntryModel } from '../models/profile.models';

@Component({
  selector: 'app-course-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form
      [formGroup]="form"
      (ngSubmit)="onSubmit()"
      class="flex flex-col gap-4"
      novalidate
    >
      <!-- Course Name -->
      <div class="flex flex-col gap-1.5">
        <label for="course-name" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Course Name <span class="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="course-name"
          type="text"
          formControlName="courseName"
          placeholder="e.g. Docker Fundamentals"
          class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                 text-gray-900 placeholder-gray-400 shadow-sm transition-colors duration-150
                 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
                 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
        @if (form.controls.courseName.invalid && form.controls.courseName.touched) {
          <p class="text-xs text-danger">Course name is required (max 200 characters).</p>
        }
      </div>

      <!-- Provider -->
      <div class="flex flex-col gap-1.5">
        <label for="course-provider" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Provider <span class="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="course-provider"
          type="text"
          formControlName="provider"
          placeholder="e.g. Udemy"
          class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                 text-gray-900 placeholder-gray-400 shadow-sm transition-colors duration-150
                 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
                 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
        @if (form.controls.provider.invalid && form.controls.provider.touched) {
          <p class="text-xs text-danger">Provider is required (max 200 characters).</p>
        }
      </div>

      <!-- Completion Date -->
      <div class="flex flex-col gap-1.5">
        <label for="course-date" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Completion Date <span class="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="course-date"
          type="date"
          formControlName="completionDate"
          [max]="today"
          class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                 text-gray-900 shadow-sm transition-colors duration-150
                 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
                 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        @if (form.controls.completionDate.invalid && form.controls.completionDate.touched) {
          <p class="text-xs text-danger">A valid completion date (not in the future) is required.</p>
        }
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 border-t border-gray-100 pt-3 dark:border-gray-700">
        <button
          type="button"
          (click)="cancelled.emit()"
          class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700
                 ring-1 ring-gray-300 transition-colors duration-150
                 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          [disabled]="form.invalid || isSaving()"
          class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white
                 transition-colors duration-150 hover:bg-primary-hover
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                 disabled:cursor-not-allowed disabled:opacity-50"
        >
          @if (isSaving()) { Saving… } @else { {{ mode() === 'edit' ? 'Save changes' : 'Add course' }} }
        </button>
      </div>
    </form>
  `,
})
export class CourseFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly mode = input<'create' | 'edit'>('create');
  readonly initialValue = input<CourseEntryModel | null>(null);
  readonly isSaving = input<boolean>(false);

  readonly submitted = output<{ courseName: string; provider: string; completionDate: string }>();
  readonly cancelled = output<void>();

  readonly today = new Date().toISOString().split('T')[0];

  readonly form = this.fb.nonNullable.group({
    courseName: ['', [Validators.required, Validators.maxLength(200)]],
    provider: ['', [Validators.required, Validators.maxLength(200)]],
    completionDate: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const v = this.initialValue();
      if (v) {
        this.form.patchValue({
          courseName: v.courseName,
          provider: v.provider,
          completionDate: v.completionDate,
        });
      }
    });
  }

  ngOnInit(): void {
    if (this.mode() === 'create' && !this.initialValue()) {
      this.form.reset({ courseName: '', provider: '', completionDate: '' });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { courseName, provider, completionDate } = this.form.getRawValue();
    this.submitted.emit({ courseName, provider, completionDate });
  }
}
