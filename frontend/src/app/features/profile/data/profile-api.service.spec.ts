import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProfileApiService } from './profile-api.service';
import {
  CompetenceProfileModel,
  CreateEducationPayload,
  EducationEntryModel,
  CertificateEntryModel,
  CourseEntryModel,
} from '../models/profile.models';

const mockProfile: CompetenceProfileModel = {
  userId: 'employee-001',
  lastUpdatedUtc: '2024-09-01T10:00:00+00:00',
  educationEntries: [],
  certificateEntries: [],
  courseEntries: [],
};

const mockEducation: EducationEntryModel = {
  id: '11111111-1111-1111-1111-111111111111',
  degree: 'Bachelor of Science',
  institution: 'MIT',
  graduationYear: 2015,
};

describe('ProfileApiService', () => {
  let service: ProfileApiService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    service = TestBed.inject(ProfileApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getProfile() should GET /api/profile', () => {
    let result: CompetenceProfileModel | undefined;
    service.getProfile().subscribe((data) => (result = data));

    const req = httpMock.expectOne('/api/profile');
    expect(req.request.method).toBe('GET');
    req.flush(mockProfile);

    expect(result).toEqual(mockProfile);
  });

  it('createEducation() should POST /api/profile/education', () => {
    const payload: CreateEducationPayload = {
      degree: 'BSc',
      institution: 'MIT',
      graduationYear: 2015,
    };

    let result: EducationEntryModel | undefined;
    service.createEducation(payload).subscribe((data) => (result = data));

    const req = httpMock.expectOne('/api/profile/education');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ ...mockEducation, ...payload });

    expect(result?.degree).toBe('BSc');
  });

  it('updateEducation() should PUT /api/profile/education/:id', () => {
    const id = mockEducation.id;
    const payload = { degree: 'MSc', institution: 'Harvard', graduationYear: 2018 };

    let result: EducationEntryModel | undefined;
    service.updateEducation(id, payload).subscribe((data) => (result = data));

    const req = httpMock.expectOne(`/api/profile/education/${id}`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockEducation, ...payload });

    expect(result?.degree).toBe('MSc');
  });

  it('deleteEducation() should DELETE /api/profile/education/:id', () => {
    let completed = false;
    service.deleteEducation(mockEducation.id).subscribe({ complete: () => (completed = true) });

    const req = httpMock.expectOne(`/api/profile/education/${mockEducation.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });

  it('createCertificate() should POST /api/profile/certificates', () => {
    const payload = {
      certificateName: 'AWS SA',
      issuingOrganization: 'Amazon',
      dateEarned: '2022-03-10',
    };

    let result: CertificateEntryModel | undefined;
    service.createCertificate(payload).subscribe((data) => (result = data));

    const req = httpMock.expectOne('/api/profile/certificates');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'cert-1', ...payload });

    expect(result?.certificateName).toBe('AWS SA');
  });

  it('deleteCertificate() should DELETE /api/profile/certificates/:id', () => {
    let completed = false;
    service.deleteCertificate('cert-1').subscribe({ complete: () => (completed = true) });

    const req = httpMock.expectOne('/api/profile/certificates/cert-1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });

  it('createCourse() should POST /api/profile/courses', () => {
    const payload = {
      courseName: 'Docker Fundamentals',
      provider: 'Udemy',
      completionDate: '2023-07-20',
    };

    let result: CourseEntryModel | undefined;
    service.createCourse(payload).subscribe((data) => (result = data));

    const req = httpMock.expectOne('/api/profile/courses');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'course-1', ...payload });

    expect(result?.courseName).toBe('Docker Fundamentals');
  });

  it('deleteCourse() should DELETE /api/profile/courses/:id', () => {
    let completed = false;
    service.deleteCourse('course-1').subscribe({ complete: () => (completed = true) });

    const req = httpMock.expectOne('/api/profile/courses/course-1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });
});
