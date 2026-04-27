import { computed, inject, signal } from '@angular/core';
import { Injectable } from '@angular/core';
import { ProfileApiService } from '../data/profile-api.service';
import {
  CertificateEntryModel,
  CompetenceProfileModel,
  CourseEntryModel,
  CreateCertificatePayload,
  CreateCoursePayload,
  CreateEducationPayload,
  EducationEntryModel,
  UpdateCertificatePayload,
  UpdateCoursePayload,
  UpdateEducationPayload,
} from '../models/profile.models';

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly api = inject(ProfileApiService);

  // ── State signals ────────────────────────────────────────────────────────

  readonly profile = signal<CompetenceProfileModel | null>(null);
  readonly loading = signal(false);
  readonly savingEducation = signal(false);
  readonly savingCertificate = signal(false);
  readonly savingCourse = signal(false);
  readonly error = signal<string | null>(null);
  readonly sectionError = signal<string | null>(null);

  // ── Computed selectors ───────────────────────────────────────────────────

  readonly educationCount = computed(() => this.profile()?.educationEntries.length ?? 0);
  readonly certificateCount = computed(() => this.profile()?.certificateEntries.length ?? 0);
  readonly courseCount = computed(() => this.profile()?.courseEntries.length ?? 0);

  readonly educationEntries = computed(
    () => this.profile()?.educationEntries ?? [],
  );
  readonly certificateEntries = computed(
    () => this.profile()?.certificateEntries ?? [],
  );
  readonly courseEntries = computed(
    () => this.profile()?.courseEntries ?? [],
  );

  // ── Load ─────────────────────────────────────────────────────────────────

  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load your profile. Please try again.');
        this.loading.set(false);
      },
    });
  }

  // ── Education ────────────────────────────────────────────────────────────

  addEducation(payload: CreateEducationPayload): void {
    this.savingEducation.set(true);
    this.sectionError.set(null);

    this.api.createEducation(payload).subscribe({
      next: (entry) => {
        this.profile.update((p) =>
          p ? { ...p, educationEntries: [...p.educationEntries, entry] } : p,
        );
        this.savingEducation.set(false);
      },
      error: () => {
        this.sectionError.set('Failed to add education entry.');
        this.savingEducation.set(false);
      },
    });
  }

  updateEducation(id: string, payload: UpdateEducationPayload): void {
    this.savingEducation.set(true);
    this.sectionError.set(null);

    this.api.updateEducation(id, payload).subscribe({
      next: (updated) => {
        this.profile.update((p) =>
          p
            ? {
                ...p,
                educationEntries: p.educationEntries.map((e) =>
                  e.id === id ? updated : e,
                ),
              }
            : p,
        );
        this.savingEducation.set(false);
      },
      error: () => {
        this.sectionError.set('Failed to update education entry.');
        this.savingEducation.set(false);
      },
    });
  }

  deleteEducation(id: string): void {
    this.api.deleteEducation(id).subscribe({
      next: () => {
        this.profile.update((p) =>
          p
            ? {
                ...p,
                educationEntries: p.educationEntries.filter((e) => e.id !== id),
              }
            : p,
        );
      },
      error: () => {
        this.sectionError.set('Failed to delete education entry.');
      },
    });
  }

  // ── Certificates ─────────────────────────────────────────────────────────

  addCertificate(payload: CreateCertificatePayload): void {
    this.savingCertificate.set(true);
    this.sectionError.set(null);

    this.api.createCertificate(payload).subscribe({
      next: (entry) => {
        this.profile.update((p) =>
          p
            ? { ...p, certificateEntries: [...p.certificateEntries, entry] }
            : p,
        );
        this.savingCertificate.set(false);
      },
      error: () => {
        this.sectionError.set('Failed to add certificate entry.');
        this.savingCertificate.set(false);
      },
    });
  }

  updateCertificate(id: string, payload: UpdateCertificatePayload): void {
    this.savingCertificate.set(true);
    this.sectionError.set(null);

    this.api.updateCertificate(id, payload).subscribe({
      next: (updated) => {
        this.profile.update((p) =>
          p
            ? {
                ...p,
                certificateEntries: p.certificateEntries.map((c) =>
                  c.id === id ? updated : c,
                ),
              }
            : p,
        );
        this.savingCertificate.set(false);
      },
      error: () => {
        this.sectionError.set('Failed to update certificate entry.');
        this.savingCertificate.set(false);
      },
    });
  }

  deleteCertificate(id: string): void {
    this.api.deleteCertificate(id).subscribe({
      next: () => {
        this.profile.update((p) =>
          p
            ? {
                ...p,
                certificateEntries: p.certificateEntries.filter(
                  (c) => c.id !== id,
                ),
              }
            : p,
        );
      },
      error: () => {
        this.sectionError.set('Failed to delete certificate entry.');
      },
    });
  }

  // ── Courses ──────────────────────────────────────────────────────────────

  addCourse(payload: CreateCoursePayload): void {
    this.savingCourse.set(true);
    this.sectionError.set(null);

    this.api.createCourse(payload).subscribe({
      next: (entry) => {
        this.profile.update((p) =>
          p ? { ...p, courseEntries: [...p.courseEntries, entry] } : p,
        );
        this.savingCourse.set(false);
      },
      error: () => {
        this.sectionError.set('Failed to add course entry.');
        this.savingCourse.set(false);
      },
    });
  }

  updateCourse(id: string, payload: UpdateCoursePayload): void {
    this.savingCourse.set(true);
    this.sectionError.set(null);

    this.api.updateCourse(id, payload).subscribe({
      next: (updated) => {
        this.profile.update((p) =>
          p
            ? {
                ...p,
                courseEntries: p.courseEntries.map((c) =>
                  c.id === id ? updated : c,
                ),
              }
            : p,
        );
        this.savingCourse.set(false);
      },
      error: () => {
        this.sectionError.set('Failed to update course entry.');
        this.savingCourse.set(false);
      },
    });
  }

  deleteCourse(id: string): void {
    this.api.deleteCourse(id).subscribe({
      next: () => {
        this.profile.update((p) =>
          p
            ? {
                ...p,
                courseEntries: p.courseEntries.filter((c) => c.id !== id),
              }
            : p,
        );
      },
      error: () => {
        this.sectionError.set('Failed to delete course entry.');
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  clearSectionError(): void {
    this.sectionError.set(null);
  }
}
