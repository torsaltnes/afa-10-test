import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CompetenceProfileModel,
  CreateCertificatePayload,
  CreateCoursePayload,
  CreateEducationPayload,
  CertificateEntryModel,
  CourseEntryModel,
  EducationEntryModel,
  UpdateCertificatePayload,
  UpdateCoursePayload,
  UpdateEducationPayload,
} from '../models/profile.models';

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/profile';

  // ── Profile ─────────────────────────────────────────────────────────────

  getProfile(): Observable<CompetenceProfileModel> {
    return this.http.get<CompetenceProfileModel>(this.base);
  }

  // ── Education ────────────────────────────────────────────────────────────

  createEducation(payload: CreateEducationPayload): Observable<EducationEntryModel> {
    return this.http.post<EducationEntryModel>(`${this.base}/education`, payload);
  }

  updateEducation(id: string, payload: UpdateEducationPayload): Observable<EducationEntryModel> {
    return this.http.put<EducationEntryModel>(`${this.base}/education/${id}`, payload);
  }

  deleteEducation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/education/${id}`);
  }

  // ── Certificates ─────────────────────────────────────────────────────────

  createCertificate(payload: CreateCertificatePayload): Observable<CertificateEntryModel> {
    return this.http.post<CertificateEntryModel>(`${this.base}/certificates`, payload);
  }

  updateCertificate(id: string, payload: UpdateCertificatePayload): Observable<CertificateEntryModel> {
    return this.http.put<CertificateEntryModel>(`${this.base}/certificates/${id}`, payload);
  }

  deleteCertificate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/certificates/${id}`);
  }

  // ── Courses ──────────────────────────────────────────────────────────────

  createCourse(payload: CreateCoursePayload): Observable<CourseEntryModel> {
    return this.http.post<CourseEntryModel>(`${this.base}/courses`, payload);
  }

  updateCourse(id: string, payload: UpdateCoursePayload): Observable<CourseEntryModel> {
    return this.http.put<CourseEntryModel>(`${this.base}/courses/${id}`, payload);
  }

  deleteCourse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/courses/${id}`);
  }
}
