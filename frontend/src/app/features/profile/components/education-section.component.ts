import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ProfileStore } from '../state/profile.store';
import { EducationEntryModel } from '../models/profile.models';
import { EducationFormComponent } from './education-form.component';

@Component({
  selector: 'app-education-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EducationFormComponent],
  template: `
    <div class="flex flex-col gap-4">
      <!-- Section header -->
      <div class="flex items-center justify-between gap-4">
        <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">Education</h3>
        @if (!isAdding() && !editingId()) {
          <button
            type="button"
            (click)="openAdd()"
            class="rounded-md px-3 py-1.5 text-sm font-medium text-primary ring-1 ring-primary/40
                   transition-colors duration-150
                   hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                   dark:text-primary dark:ring-primary/30 dark:hover:bg-primary/10"
          >
            + Add
          </button>
        }
      </div>

      <!-- Section error -->
      @if (sectionError()) {
        <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700
                  dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-300" role="alert">
          {{ sectionError() }}
        </p>
      }

      <!-- Inline add form -->
      @if (isAdding()) {
        <div class="rounded-xl border border-primary/30 bg-blue-50/50 p-4 dark:bg-blue-900/10">
          <p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">New education entry</p>
          <app-education-form
            mode="create"
            [isSaving]="store.savingEducation()"
            (submitted)="onAdd($event)"
            (cancelled)="closeAdd()"
          />
        </div>
      }

      <!-- Entry list -->
      @if (entries().length > 0) {
        <ul class="flex flex-col gap-2" role="list">
          @for (entry of entries(); track entry.id) {
            <li class="rounded-xl border border-gray-200 bg-surface p-4
                       dark:border-gray-700 dark:bg-surface-dark">
              @if (editingId() === entry.id) {
                <!-- Edit form inline -->
                <p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Edit education entry</p>
                <app-education-form
                  mode="edit"
                  [initialValue]="entry"
                  [isSaving]="store.savingEducation()"
                  (submitted)="onUpdate(entry.id, $event)"
                  (cancelled)="closeEdit()"
                />
              } @else {
                <!-- Entry row -->
                <div class="flex items-start justify-between gap-3">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {{ entry.degree }}
                    </span>
                    <span class="text-sm text-gray-600 dark:text-gray-400">{{ entry.institution }}</span>
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ entry.graduationYear }}</span>
                  </div>
                  <div class="flex shrink-0 gap-2">
                    <button
                      type="button"
                      (click)="openEdit(entry)"
                      class="rounded px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-300
                             transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                             dark:text-gray-400 dark:ring-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      (click)="onDelete(entry.id)"
                      class="rounded px-2 py-1 text-xs font-medium text-danger ring-1 ring-danger/30
                             transition-colors duration-150 hover:bg-red-50
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger
                             dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              }
            </li>
          }
        </ul>
      } @else if (!isAdding()) {
        <!-- Empty state -->
        <div class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 py-8
                    text-center dark:border-gray-600">
          <p class="text-sm text-gray-500 dark:text-gray-400">No education entries yet.</p>
          <button
            type="button"
            (click)="openAdd()"
            class="text-sm font-medium text-primary transition-colors hover:text-primary-hover
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            + Add your first degree
          </button>
        </div>
      }
    </div>
  `,
})
export class EducationSectionComponent {
  readonly store = inject(ProfileStore);

  readonly entries = input.required<EducationEntryModel[]>();
  readonly sectionError = input<string | null>(null);

  readonly isAdding = signal(false);
  readonly editingId = signal<string | null>(null);

  openAdd(): void {
    this.editingId.set(null);
    this.isAdding.set(true);
    this.store.clearSectionError();
  }

  closeAdd(): void {
    this.isAdding.set(false);
  }

  openEdit(entry: EducationEntryModel): void {
    this.isAdding.set(false);
    this.editingId.set(entry.id);
    this.store.clearSectionError();
  }

  closeEdit(): void {
    this.editingId.set(null);
  }

  onAdd(payload: { degree: string; institution: string; graduationYear: number }): void {
    this.store.addEducation(payload);
    this.isAdding.set(false);
  }

  onUpdate(id: string, payload: { degree: string; institution: string; graduationYear: number }): void {
    this.store.updateEducation(id, payload);
    this.editingId.set(null);
  }

  onDelete(id: string): void {
    this.store.deleteEducation(id);
  }
}
