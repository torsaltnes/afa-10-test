import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { HealthPageComponent } from './health-page.component';
import { HealthStatus } from '../../core/models/health-status.model';

const mockHealth: HealthStatus = {
  status: 'Healthy',
  serviceName: 'GreenfieldArchitecture',
  version: '1.0.0',
  environment: 'Development',
  checkedAtUtc: '2024-06-15T12:00:00+00:00',
};

describe('HealthPageComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(HealthPageComponent);
    fixture.detectChanges(); // triggers rxResource to start loading
    httpMock.expectOne('/api/health').flush(mockHealth);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the loading spinner before the response resolves', () => {
    const fixture = TestBed.createComponent(HealthPageComponent);
    fixture.detectChanges(); // HTTP request is pending; spinner must be visible

    const spinner = (fixture.nativeElement as HTMLElement).querySelector('[role="status"]');
    expect(spinner).not.toBeNull();

    // Resolve to satisfy afterEach verify
    httpMock.expectOne('/api/health').flush(mockHealth);
  });

  it('should render health data after a successful response', async () => {
    const fixture = TestBed.createComponent(HealthPageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/health').flush(mockHealth);

    // Allow signal updates and microtasks to propagate
    await Promise.resolve();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('GreenfieldArchitecture');
    expect(compiled.textContent).toContain('Healthy');
    expect(compiled.textContent).toContain('1.0.0');
    expect(compiled.textContent).toContain('Development');
  });

  it('should show the error state when the API fails', async () => {
    const fixture = TestBed.createComponent(HealthPageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/health').flush(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });

    await Promise.resolve();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('should reload data when reload() is called', async () => {
    const fixture = TestBed.createComponent(HealthPageComponent);
    fixture.detectChanges();

    // First request
    httpMock.expectOne('/api/health').flush(mockHealth);
    await Promise.resolve();
    fixture.detectChanges();

    // Trigger reload
    fixture.componentInstance.reload();
    fixture.detectChanges();

    // Second request must appear
    httpMock.expectOne('/api/health').flush(mockHealth);
    await Promise.resolve();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Healthy');
  });
});
