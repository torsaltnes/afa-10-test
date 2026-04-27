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
import { CertificateEntryModel } from '../models/profile.models';

@Component({
  selector: 'app-certificate-form',
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
      <!-- Certificate Name -->
      <div class="flex flex-col gap-1.5">
        <label for="cert-name" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Certificate Name <span class="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="cert-name"
          type="text"
          formControlName="certificateName"
          placeholder="e.g. AWS Solutions Architect"
          class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                 text-gray-900 placeholder-gray-400 shadow-sm transition-colors duration-150
                 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
                 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
        @if (form.controls.certificateName.invalid && form.controls.certificateName.touched) {
          <p class="text-xs text-danger">Certificate name is required (max 200 characters).</p>
        }
      </div>

      <!-- Issuing Organization -->
      <div class="flex flex-col gap-1.5">
        <label for="cert-org" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Issuing Organization <span class="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="cert-org"
          type="text"
          formControlName="issuingOrganization"
          placeholder="e.g. Amazon Web Services"
          class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                 text-gray-900 placeholder-gray-400 shadow-sm transition-colors duration-150
                 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
                 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
        @if (form.controls.issuingOrganization.invalid && form.controls.issuingOrganization.touched) {
          <p class="text-xs text-danger">Issuing organization is required (max 200 characters).</p>
        }
      </div>

      <!-- Date Earned -->
      <div class="flex flex-col gap-1.5">
        <label for="cert-date" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Date Earned <span class="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="cert-date"
          type="date"
          formControlName="dateEarned"
          [max]="today"
          class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                 text-gray-900 shadow-sm transition-colors duration-150
                 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
                 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        @if (form.controls.dateEarned.invalid && form.controls.dateEarned.touched) {
          <p class="text-xs text-danger">A valid date (not in the future) is required.</p>
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
          @if (isSaving()) { Saving… } @else { {{ mode() === 'edit' ? 'Save changes' : 'Add certificate' }} }
        </button>
      </div>
    </form>
  `,
})
export class CertificateFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly mode = input<'create' | 'edit'>('create');
  readonly initialValue = input<CertificateEntryModel | null>(null);
  readonly isSaving = input<boolean>(false);

  readonly submitted = output<{ certificateName: string; issuingOrganization: string; dateEarned: string }>();
  readonly cancelled = output<void>();

  readonly today = new Date().toISOString().split('T')[0];

  readonly form = this.fb.nonNullable.group({
    certificateName: ['', [Validators.required, Validators.maxLength(200)]],
    issuingOrganization: ['', [Validators.required, Validators.maxLength(200)]],
    dateEarned: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const v = this.initialValue();
      if (v) {
        this.form.patchValue({
          certificateName: v.certificateName,
          issuingOrganization: v.issuingOrganization,
          dateEarned: v.dateEarned,
        });
      }
    });
  }

  ngOnInit(): void {
    if (this.mode() === 'create' && !this.initialValue()) {
      this.form.reset({ certificateName: '', issuingOrganization: '', dateEarned: '' });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { certificateName, issuingOrganization, dateEarned } = this.form.getRawValue();
    this.submitted.emit({ certificateName, issuingOrganization, dateEarned });
  }
}
