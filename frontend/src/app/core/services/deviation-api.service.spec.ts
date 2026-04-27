import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DeviationApiService } from './deviation-api.service';
import {
  CreateDeviationPayload,
  DeviationModel,
  UpdateDeviationPayload,
} from '../models/deviation.model';

const mockDeviation: DeviationModel = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Test deviation',
  description: 'A test description',
  severity: 'High',
  status: 'Open',
  reportedBy: 'tester',
  reportedAt: '2024-09-01T10:00:00+00:00',
  updatedAt: '2024-09-01T10:00:00+00:00',
};

describe('DeviationApiService', () => {
  let service: DeviationApiService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    service = TestBed.inject(DeviationApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAll() should GET /api/deviations', () => {
    let result: DeviationModel[] | undefined;
    service.getAll().subscribe((data) => (result = data));

    const req = httpMock.expectOne('/api/deviations');
    expect(req.request.method).toBe('GET');
    req.flush([mockDeviation]);

    expect(result).toEqual([mockDeviation]);
  });

  it('getById() should GET /api/deviations/:id', () => {
    let result: DeviationModel | undefined;
    service.getById(mockDeviation.id).subscribe((data) => (result = data));

    const req = httpMock.expectOne(`/api/deviations/${mockDeviation.id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDeviation);

    expect(result).toEqual(mockDeviation);
  });

  it('create() should POST /api/deviations with payload', () => {
    const payload: CreateDeviationPayload = {
      title: 'New',
      description: 'Desc',
      severity: 'Low',
      status: 'Open',
      reportedBy: 'user',
    };

    let result: DeviationModel | undefined;
    service.create(payload).subscribe((data) => (result = data));

    const req = httpMock.expectOne('/api/deviations');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ ...mockDeviation, ...payload });

    expect(result?.title).toBe('New');
  });

  it('update() should PUT /api/deviations/:id with payload', () => {
    const payload: UpdateDeviationPayload = {
      title: 'Updated',
      description: 'New desc',
      severity: 'Critical',
      status: 'InProgress',
      reportedBy: 'updater',
    };

    let result: DeviationModel | undefined;
    service.update(mockDeviation.id, payload).subscribe((data) => (result = data));

    const req = httpMock.expectOne(`/api/deviations/${mockDeviation.id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ ...mockDeviation, ...payload });

    expect(result?.title).toBe('Updated');
  });

  it('delete() should DELETE /api/deviations/:id', () => {
    let completed = false;
    service.delete(mockDeviation.id).subscribe({ complete: () => (completed = true) });

    const req = httpMock.expectOne(`/api/deviations/${mockDeviation.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });
});
