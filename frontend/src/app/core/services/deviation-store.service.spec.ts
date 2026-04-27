import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DeviationStoreService } from './deviation-store.service';
import { Deviation } from '../models/deviation.model';

const mockDeviation: Deviation = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Test Deviation',
  description: 'Test description',
  severity: 'High',
  status: 'Open',
  createdAtUtc: '2024-08-20T10:00:00+00:00',
  lastModifiedAtUtc: '2024-08-20T10:00:00+00:00',
};

const mockDeviation2: Deviation = {
  id: '22222222-2222-2222-2222-222222222222',
  title: 'Second Deviation',
  description: 'Another description',
  severity: 'Low',
  status: 'Resolved',
  createdAtUtc: '2024-08-19T10:00:00+00:00',
  lastModifiedAtUtc: '2024-08-21T10:00:00+00:00',
};

describe('DeviationStoreService', () => {
  let service: DeviationStoreService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), DeviationStoreService],
    });
    service = TestBed.inject(DeviationStoreService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it('should have empty initial state', () => {
    expect(service.items()).toEqual([]);
    expect(service.selectedId()).toBeNull();
    expect(service.mode()).toBe('view');
    expect(service.loading()).toBe(false);
    expect(service.saving()).toBe(false);
    expect(service.deleting()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.isEmpty()).toBe(true);
  });

  // ── Load ───────────────────────────────────────────────────────────────────

  it('should populate items on successful load', async () => {
    const loadPromise = service.load();
    const req = httpMock.expectOne('/api/deviations');
    req.flush([mockDeviation]);
    await loadPromise;

    expect(service.items()).toHaveLength(1);
    expect(service.items()[0].id).toBe(mockDeviation.id);
    expect(service.loading()).toBe(false);
    expect(service.isEmpty()).toBe(false);
  });

  it('should set error signal when load fails', async () => {
    const loadPromise = service.load();
    httpMock.expectOne('/api/deviations').flush(null, { status: 500, statusText: 'Server Error' });
    await loadPromise;

    expect(service.error()).not.toBeNull();
    expect(service.loading()).toBe(false);
  });

  // ── Create ─────────────────────────────────────────────────────────────────

  it('should append newly created deviation and select it', async () => {
    // Pre-populate
    const loadPromise = service.load();
    httpMock.expectOne('/api/deviations').flush([]);
    await loadPromise;

    service.startCreate(); // must be in create mode before calling save

    const savePromise = service.save({
      title: 'New',
      description: 'Desc',
      severity: 'Medium',
    });

    const req = httpMock.expectOne('/api/deviations');
    expect(req.request.method).toBe('POST');
    req.flush(mockDeviation);

    await savePromise;

    expect(service.items()).toHaveLength(1);
    expect(service.selectedId()).toBe(mockDeviation.id);
    expect(service.mode()).toBe('view');
  });

  it('should set error signal when create fails', async () => {
    service.startCreate();
    const savePromise = service.save({
      title: 'New',
      description: 'Desc',
      severity: 'Low',
    });

    httpMock.expectOne('/api/deviations').flush(null, { status: 400, statusText: 'Bad Request' });
    await savePromise;

    expect(service.error()).not.toBeNull();
    expect(service.saving()).toBe(false);
  });

  // ── Update ─────────────────────────────────────────────────────────────────

  it('should mutate selected item in signals on successful update', async () => {
    // Pre-populate
    const loadPromise = service.load();
    httpMock.expectOne('/api/deviations').flush([mockDeviation]);
    await loadPromise;

    service.startEdit(mockDeviation.id);

    const updatedDeviation: Deviation = { ...mockDeviation, title: 'Updated', status: 'Resolved' };

    const savePromise = service.save({
      title: 'Updated',
      description: mockDeviation.description,
      severity: mockDeviation.severity,
      status: 'Resolved',
    });

    const req = httpMock.expectOne(`/api/deviations/${mockDeviation.id}`);
    expect(req.request.method).toBe('PUT');
    req.flush(updatedDeviation);

    await savePromise;

    expect(service.items()[0].title).toBe('Updated');
    expect(service.mode()).toBe('view');
  });

  // ── Delete ─────────────────────────────────────────────────────────────────

  it('should remove item and clear selection when deleted item was selected', async () => {
    const loadPromise = service.load();
    httpMock.expectOne('/api/deviations').flush([mockDeviation]);
    await loadPromise;

    service.select(mockDeviation.id);

    const removePromise = service.remove(mockDeviation.id);
    httpMock.expectOne(`/api/deviations/${mockDeviation.id}`).flush(null, { status: 204, statusText: 'No Content' });
    await removePromise;

    expect(service.items()).toHaveLength(0);
    expect(service.selectedId()).toBeNull();
    expect(service.mode()).toBe('view');
  });

  it('should set error when delete fails', async () => {
    const loadPromise = service.load();
    httpMock.expectOne('/api/deviations').flush([mockDeviation]);
    await loadPromise;

    const removePromise = service.remove(mockDeviation.id);
    httpMock.expectOne(`/api/deviations/${mockDeviation.id}`).flush(null, { status: 500, statusText: 'Error' });
    await removePromise;

    expect(service.error()).not.toBeNull();
    expect(service.deleting()).toBe(false);
  });

  // ── Computed signals ───────────────────────────────────────────────────────

  it('sortedItems should order by lastModifiedAtUtc descending', async () => {
    const loadPromise = service.load();
    httpMock.expectOne('/api/deviations').flush([mockDeviation, mockDeviation2]);
    await loadPromise;

    const sorted = service.sortedItems();
    expect(sorted[0].id).toBe(mockDeviation2.id); // newer lastModified
    expect(sorted[1].id).toBe(mockDeviation.id);
  });

  it('selectedDeviation should return the deviation matching selectedId', async () => {
    const loadPromise = service.load();
    httpMock.expectOne('/api/deviations').flush([mockDeviation]);
    await loadPromise;

    service.select(mockDeviation.id);

    expect(service.selectedDeviation()?.id).toBe(mockDeviation.id);
  });
});
