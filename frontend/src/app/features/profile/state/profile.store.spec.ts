import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProfileStore } from './profile.store';
import { CompetenceProfileModel, EducationEntryModel } from '../models/profile.models';

const mockProfile: CompetenceProfileModel = {
  userId: 'employee-001',
  lastUpdatedUtc: '2024-09-01T10:00:00Z',
  educationEntries: [
    { id: 'edu-1', degree: 'BSc', institution: 'MIT', graduationYear: 2015 },
  ],
  certificateEntries: [],
  courseEntries: [],
};

describe('ProfileStore', () => {
  let store: ProfileStore;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    store = TestBed.inject(ProfileStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('initial loading signal should be false', () => {
    expect(store.loading()).toBe(false);
  });

  it('loadProfile() should set loading=true then false after response', async () => {
    store.loadProfile();
    expect(store.loading()).toBe(true);

    httpMock.expectOne('/api/profile').flush(mockProfile);
    await Promise.resolve();

    expect(store.loading()).toBe(false);
    expect(store.profile()).toEqual(mockProfile);
  });

  it('educationCount computed should reflect loaded entries', async () => {
    store.loadProfile();
    httpMock.expectOne('/api/profile').flush(mockProfile);
    await Promise.resolve();

    expect(store.educationCount()).toBe(1);
    expect(store.certificateCount()).toBe(0);
    expect(store.courseCount()).toBe(0);
  });

  it('loadProfile() should set error on API failure', async () => {
    store.loadProfile();

    httpMock.expectOne('/api/profile').flush(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
    await Promise.resolve();

    expect(store.error()).not.toBeNull();
    expect(store.loading()).toBe(false);
  });

  it('addEducation() should append entry to educationEntries', async () => {
    // Seed the store with a profile first
    store.loadProfile();
    httpMock.expectOne('/api/profile').flush({ ...mockProfile, educationEntries: [] });
    await Promise.resolve();

    const newEntry: EducationEntryModel = {
      id: 'edu-new',
      degree: 'MSc',
      institution: 'Harvard',
      graduationYear: 2020,
    };

    store.addEducation({ degree: 'MSc', institution: 'Harvard', graduationYear: 2020 });
    httpMock.expectOne('/api/profile/education').flush(newEntry);
    await Promise.resolve();

    expect(store.educationEntries()).toContain(newEntry);
    expect(store.educationCount()).toBe(1);
  });

  it('deleteEducation() should remove entry from educationEntries', async () => {
    store.loadProfile();
    httpMock.expectOne('/api/profile').flush(mockProfile);
    await Promise.resolve();

    store.deleteEducation('edu-1');
    httpMock.expectOne('/api/profile/education/edu-1').flush(null, { status: 204, statusText: 'No Content' });
    await Promise.resolve();

    expect(store.educationEntries().some((e) => e.id === 'edu-1')).toBe(false);
    expect(store.educationCount()).toBe(0);
  });

  it('updateEducation() should replace existing entry', async () => {
    store.loadProfile();
    httpMock.expectOne('/api/profile').flush(mockProfile);
    await Promise.resolve();

    const updated: EducationEntryModel = {
      id: 'edu-1',
      degree: 'PhD',
      institution: 'MIT',
      graduationYear: 2022,
    };

    store.updateEducation('edu-1', { degree: 'PhD', institution: 'MIT', graduationYear: 2022 });
    httpMock.expectOne('/api/profile/education/edu-1').flush(updated);
    await Promise.resolve();

    const found = store.educationEntries().find((e) => e.id === 'edu-1');
    expect(found?.degree).toBe('PhD');
  });

  it('clearSectionError() should reset sectionError to null', () => {
    store.sectionError.set('some error');
    store.clearSectionError();
    expect(store.sectionError()).toBeNull();
  });
});
