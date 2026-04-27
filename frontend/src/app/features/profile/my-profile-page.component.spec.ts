import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MyProfilePageComponent } from './my-profile-page.component';
import { CompetenceProfileModel } from './models/profile.models';

const emptyProfile: CompetenceProfileModel = {
  userId: 'employee-001',
  lastUpdatedUtc: '2024-09-01T10:00:00Z',
  educationEntries: [],
  certificateEntries: [],
  courseEntries: [],
};

const populatedProfile: CompetenceProfileModel = {
  ...emptyProfile,
  educationEntries: [
    { id: 'edu-1', degree: 'BSc Computer Science', institution: 'MIT', graduationYear: 2015 },
  ],
  certificateEntries: [
    { id: 'cert-1', certificateName: 'AWS Solutions Architect', issuingOrganization: 'Amazon', dateEarned: '2022-03-10' },
  ],
  courseEntries: [
    { id: 'course-1', courseName: 'Docker Fundamentals', provider: 'Udemy', completionDate: '2023-07-20' },
  ],
};

describe('MyProfilePageComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyProfilePageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(MyProfilePageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/profile').flush(emptyProfile);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show loading spinner initially', () => {
    const fixture = TestBed.createComponent(MyProfilePageComponent);
    fixture.detectChanges();

    const spinner = (fixture.nativeElement as HTMLElement).querySelector('[role="status"]');
    expect(spinner).not.toBeNull();

    httpMock.expectOne('/api/profile').flush(emptyProfile);
  });

  it('should render page heading', async () => {
    const fixture = TestBed.createComponent(MyProfilePageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/profile').flush(emptyProfile);
    await Promise.resolve();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('My Profile');
  });

  it('should render summary card after load', async () => {
    const fixture = TestBed.createComponent(MyProfilePageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/profile').flush(populatedProfile);
    await Promise.resolve();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Education');
    expect(text).toContain('Certificates');
    expect(text).toContain('Courses');
  });

  it('should render education entries when populated', async () => {
    const fixture = TestBed.createComponent(MyProfilePageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/profile').flush(populatedProfile);
    await Promise.resolve();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('BSc Computer Science');
  });

  it('should render certificate entries when populated', async () => {
    const fixture = TestBed.createComponent(MyProfilePageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/profile').flush(populatedProfile);
    await Promise.resolve();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('AWS Solutions Architect');
  });

  it('should render course entries when populated', async () => {
    const fixture = TestBed.createComponent(MyProfilePageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/profile').flush(populatedProfile);
    await Promise.resolve();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Docker Fundamentals');
  });

  it('should show error banner on API failure', async () => {
    const fixture = TestBed.createComponent(MyProfilePageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/profile').flush(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
    await Promise.resolve();
    fixture.detectChanges();

    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
  });

  it('should show empty state message when education list is empty', async () => {
    const fixture = TestBed.createComponent(MyProfilePageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/profile').flush(emptyProfile);
    await Promise.resolve();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No education entries yet');
  });
});
