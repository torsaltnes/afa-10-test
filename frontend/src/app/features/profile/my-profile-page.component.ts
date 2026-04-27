import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ProfileStore } from './state/profile.store';
import { EducationSectionComponent } from './components/education-section.component';
import { CertificatesSectionComponent } from './components/certificates-section.component';
import { CoursesSectionComponent } from './components/courses-section.component';

@Component({
  selector: 'app-my-profile-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EducationSectionComponent,
    CertificatesSectionComponent,
    CoursesSectionComponent,
  ],
  template: `
    <section class="flex flex-col gap-6" aria-live="polite">

      <!-- ─── Page header ──────────────────────────────────────────────────── -->
      <div class="flex flex-col gap-1">
        <h2 class="text-2xl font-semibold tracking-tight text-balance
                   text-gray-900 dark:text-gray-100">
          My Profile
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Manage your education, professional certificates, and completed courses.
        </p>
      </div>
      <!-- ──────────────────────────────────────────────────────────────────── -->

      <!-- ─── Page-level error banner ──────────────────────────────────────── -->
      @if (store.error()) {
        <div
          class="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4
                 dark:border-red-800/40 dark:bg-red-900/20"
          role="alert"
        >
          <svg class="mt-0.5 size-5 shrink-0 text-danger" viewBox="0 0 20 20"
               fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0
                 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10
                 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75
                 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clip-rule="evenodd" />
          </svg>
          <p class="text-sm font-semibold text-red-800 dark:text-red-300">
            {{ store.error() }}
          </p>
        </div>
      }
      <!-- ──────────────────────────────────────────────────────────────────── -->

      <!-- ─── Loading state ────────────────────────────────────────────────── -->
      @if (store.loading()) {
        <div
          class="flex min-h-48 items-center justify-center rounded-xl
                 border border-gray-200 bg-surface p-12
                 dark:border-gray-700 dark:bg-surface-dark"
          role="status"
          aria-label="Loading profile"
        >
          <div class="flex flex-col items-center gap-3">
            <div
              class="size-10 animate-spin rounded-full border-4
                     border-primary border-t-transparent"
              aria-hidden="true"
            ></div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Loading your profile…</p>
          </div>
        </div>

      <!-- ─── Profile content ───────────────────────────────────────────────── -->
      } @else if (!store.error()) {

        <!-- Summary card -->
        <div class="rounded-xl border border-gray-200 bg-surface p-4 shadow-sm
                    dark:border-gray-700 dark:bg-surface-dark md:p-6">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="flex flex-col gap-1">
              <span class="text-2xl font-bold text-primary">{{ store.educationCount() }}</span>
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Education</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-2xl font-bold text-primary">{{ store.certificateCount() }}</span>
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Certificates</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-2xl font-bold text-primary">{{ store.courseCount() }}</span>
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Courses</span>
            </div>
          </div>
        </div>

        <!-- Three section cards -->
        <div class="grid grid-cols-1 gap-6">

          <!-- Education -->
          <div class="rounded-xl border border-gray-200 bg-surface p-4 shadow-sm
                      dark:border-gray-700 dark:bg-surface-dark md:p-6">
            <app-education-section
              [entries]="store.educationEntries()"
              [sectionError]="store.sectionError()"
            />
          </div>

          <!-- Certificates -->
          <div class="rounded-xl border border-gray-200 bg-surface p-4 shadow-sm
                      dark:border-gray-700 dark:bg-surface-dark md:p-6">
            <app-certificates-section
              [entries]="store.certificateEntries()"
              [sectionError]="store.sectionError()"
            />
          </div>

          <!-- Courses -->
          <div class="rounded-xl border border-gray-200 bg-surface p-4 shadow-sm
                      dark:border-gray-700 dark:bg-surface-dark md:p-6">
            <app-courses-section
              [entries]="store.courseEntries()"
              [sectionError]="store.sectionError()"
            />
          </div>

        </div>
      }
      <!-- ──────────────────────────────────────────────────────────────────── -->

    </section>
  `,
})
export class MyProfilePageComponent implements OnInit {
  readonly store = inject(ProfileStore);

  ngOnInit(): void {
    this.store.loadProfile();
  }
}
