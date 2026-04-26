import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DeviationApiService } from './deviation-api.service';
import { Deviation } from '../models/deviation.model';
import { DeviationForm } from '../models/deviation-form.model';
import { environment } from '../../../environments/environment';

describe('DeviationApiService', () => {
  let service: DeviationApiService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiBaseUrl}/deviations`;

  const mockDeviation: Deviation = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Deviation',
    description: 'Some description',
    severity: 'Medium',
    status: 'Open',
    reportedBy: 'Test User',
    occurredAt: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockForm: DeviationForm = {
    title: 'Test Deviation',
    description: 'Some description',
    severity: 'Medium',
    status: 'Open',
    reportedBy: 'Test User',
    occurredAt: '2024-01-01'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(DeviationApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAll() should GET /deviations and return array', () => {
    service.getAll().subscribe(result => {
      expect(result).toEqual([mockDeviation]);
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([mockDeviation]);
  });

  it('getById() should GET /deviations/:id', () => {
    const id = mockDeviation.id;
    service.getById(id).subscribe(result => {
      expect(result).toEqual(mockDeviation);
    });

    const req = httpMock.expectOne(`${base}/${id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDeviation);
  });

  it('create() should POST /deviations with payload', () => {
    service.create(mockForm).subscribe(result => {
      expect(result).toEqual(mockDeviation);
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockForm);
    req.flush(mockDeviation);
  });

  it('update() should PUT /deviations/:id with payload', () => {
    const id = mockDeviation.id;
    service.update(id, mockForm).subscribe(result => {
      expect(result).toEqual(mockDeviation);
    });

    const req = httpMock.expectOne(`${base}/${id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(mockForm);
    req.flush(mockDeviation);
  });

  it('delete() should DELETE /deviations/:id', () => {
    const id = mockDeviation.id;
    service.delete(id).subscribe();

    const req = httpMock.expectOne(`${base}/${id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
