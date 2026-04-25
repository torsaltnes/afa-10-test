import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HealthApiService } from './health-api.service';
import { HealthStatus } from '../models/health-status.model';

describe('HealthApiService', () => {
  let service: HealthApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(HealthApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should issue GET /api/health', () => {
    const mockResponse: HealthStatus = {
      status: 'Healthy',
      applicationName: 'Greenfield.Api',
      environment: 'Development',
      checkedAtUtc: '2026-04-25T12:00:00Z'
    };

    service.getHealthStatus().subscribe();

    const req = httpMock.expectOne('/api/health');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should deserialize the response into HealthStatus shape', () => {
    const mockResponse: HealthStatus = {
      status: 'Healthy',
      applicationName: 'Greenfield.Api',
      environment: 'Production',
      checkedAtUtc: '2026-04-25T10:30:00Z'
    };

    let result: HealthStatus | undefined;
    service.getHealthStatus().subscribe((data) => (result = data));

    const req = httpMock.expectOne('/api/health');
    req.flush(mockResponse);

    expect(result).toEqual(mockResponse);
    expect(result?.status).toBe('Healthy');
    expect(result?.applicationName).toBe('Greenfield.Api');
    expect(result?.environment).toBe('Production');
    expect(result?.checkedAtUtc).toBe('2026-04-25T10:30:00Z');
  });
});
