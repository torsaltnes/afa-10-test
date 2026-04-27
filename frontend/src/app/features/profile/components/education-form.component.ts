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
import { EducationEntryModel } from '../models/profile.models';

@Component({
  selector: 'app-education-form',
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
      <!-- Degree -->
      <div class="flex flex-col gap-1.5">
        <label for="edu-degree" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Degree <span class="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="edu-degree"
          type="text"
          formControlName="degree"
          placeholder="e.g. Bachelor of Science in Computer Science"
          class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                 text-gray-900 placeholder-gray-400 shadow-sm transition-colors duration-150
                 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
                 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
        @if (form.controls.degree.invalid && form.controls.degree.touched) {
          <p class="text-xs text-danger">Degree is required (max 200 characters).</p>
        }
      </div>

      <!-- Institution -->
      <div class="flex flex-col gap-1.5">
        <label for="edu-institution" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Institution <span class="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="edu-institution"
          type="text"
          formControlName="institution"
          placeholder="e.g. MIT"
          class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                 text-gray-900 placeholder-gray-400 shadow-sm transition-colors duration-150
                 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
                 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
        @if (form.controls.institution.invalid && form.controls.institution.touched) {
          <p class="text-xs text-danger">Institution is required (max 200 characters).</p>
        }
      </div>

      <!-- Graduation Year -->
      <div class="flex flex-col gap-1.5">
        <label for="edu-year" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Graduation Year <span class="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="edu-year"
          type="number"
          formControlName="graduationYear"
          placeholder="e.g. 2020"
          min="1900"
          [max]="maxYear"
          class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                 text-gray-900 placeholder-gray-400 shadow-sm transition-colors duration-150
                 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
                 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
        @if (form.controls.graduationYear.invalid && form.controls.graduationYear.touched) {
          <p class="text-xs text-danger">A valid graduation year between 1900 and {{ maxYear }} is required.</p>
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
          @if (isSaving()) { Saving… } @else { {{ mode() === 'edit' ? 'Save changes' : 'Add education' }} }
        </button>
      </div>
    </form>
  `,
})
export class EducationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly mode = input<'create' | 'edit'>('create');
  readonly initialValue = input<EducationEntryModel | null>(null);
  readonly isSaving = input<boolean>(false);

  readonly submitted = output<{ degree: string; institution: string; graduationYear: number }>();
  readonly cancelled = output<void>();

  readonly maxYear = new Date().getFullYear() + 1;

  readonly form = this.fb.nonNullable.group({
    degree: ['', [Validators.required, Validators.maxLength(200)]],
    institution: ['', [Validators.required, Validators.maxLength(200)]],
    graduationYear: [
      new Date().getFullYear(),
      [Validators.required, Validators.min(1900), Validators.max(this.maxYear)],
    ],
  });

  constructor() {
    effect(() => {
      const v = this.initialValue();
      if (v) {
        this.form.patchValue({
          degree: v.degree,
          institution: v.institution,
          graduationYear: v.graduationYear,
        });
      }
    });
  }

  ngOnInit(): void {
    if (this.mode() === 'create' && !this.initialValue()) {
      this.form.reset({ degree: '', institution: '', graduationYear: new Date().getFullYear() });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { degree, institution, graduationYear } = this.form.getRawValue();
    this.submitted.emit({ degree, institution, graduationYear });
  }
}
