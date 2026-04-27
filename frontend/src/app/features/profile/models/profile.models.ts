// ── Domain models ────────────────────────────────────────────────────────────

export interface EducationEntryModel {
  id: string;
  degree: string;
  institution: string;
  graduationYear: number;
}

export interface CertificateEntryModel {
  id: string;
  certificateName: string;
  issuingOrganization: string;
  dateEarned: string; // ISO date string: "YYYY-MM-DD"
}

export interface CourseEntryModel {
  id: string;
  courseName: string;
  provider: string;
  completionDate: string; // ISO date string: "YYYY-MM-DD"
}

export interface CompetenceProfileModel {
  userId: string;
  lastUpdatedUtc: string;
  educationEntries: EducationEntryModel[];
  certificateEntries: CertificateEntryModel[];
  courseEntries: CourseEntryModel[];
}

// ── Request payloads ──────────────────────────────────────────────────────────

export interface CreateEducationPayload {
  degree: string;
  institution: string;
  graduationYear: number;
}

export interface UpdateEducationPayload {
  degree: string;
  institution: string;
  graduationYear: number;
}

export interface CreateCertificatePayload {
  certificateName: string;
  issuingOrganization: string;
  dateEarned: string; // "YYYY-MM-DD"
}

export interface UpdateCertificatePayload {
  certificateName: string;
  issuingOrganization: string;
  dateEarned: string; // "YYYY-MM-DD"
}

export interface CreateCoursePayload {
  courseName: string;
  provider: string;
  completionDate: string; // "YYYY-MM-DD"
}

export interface UpdateCoursePayload {
  courseName: string;
  provider: string;
  completionDate: string; // "YYYY-MM-DD"
}
