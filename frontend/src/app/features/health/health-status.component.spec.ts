import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HealthStatusComponent } from './health-status.component';
import { HealthApiService } from '../../core/services/health-api.service';
import { HealthStatus } from '../../core/models/health-status.model';
import { of, throwError, Observable } from 'rxjs';
import { vi } from 'vitest';

describe('HealthStatusComponent', () => {
  const mockGetHealthStatus = vi.fn();
  const mockHealthApiService = { getHealthStatus: mockGetHealthStatus };

  beforeEach(async () => {
    vi.resetAllMocks();

    await TestBed.configureTestingModule({
      imports: [HealthStatusComponent],
      providers: [
        { provide: HealthApiService, useValue: mockHealthApiService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(HealthStatusComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should start in idle state with no loading and no data', () => {
    const fixture = TestBed.createComponent(HealthStatusComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.health()).toBeNull();
    expect(component.errorMessage()).toBeNull();
    expect(component.hasHealthData()).toBe(false);
  });

  it('should set isLoading to true while request is unresolved', () => {
    const fixture = TestBed.createComponent(HealthStatusComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // Return an observable that never completes
    mockGetHealthStatus.mockReturnValue(new Observable(() => {}));

    component.runHealthCheck();
    fixture.detectChanges();

    expect(component.isLoading()).toBe(true);
  });

  it('should populate health signal and clear loading on success', () => {
    const fixture = TestBed.createComponent(HealthStatusComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const mockStatus: HealthStatus = {
      status: 'Healthy',
      applicationName: 'Greenfield.Api',
      environment: 'Development',
      checkedAtUtc: '2026-04-25T12:00:00Z'
    };
    mockGetHealthStatus.mockReturnValue(of(mockStatus));

    component.runHealthCheck();
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.health()).toEqual(mockStatus);
    expect(component.hasHealthData()).toBe(true);
    expect(component.errorMessage()).toBeNull();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Healthy');
    expect(el.textContent).toContain('Greenfield.Api');
  });

  it('should set errorMessage and clear loading when service fails', () => {
    const fixture = TestBed.createComponent(HealthStatusComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    mockGetHealthStatus.mockReturnValue(
      throwError(() => new Error('Network error'))
    );

    component.runHealthCheck();
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.health()).toBeNull();
    expect(component.errorMessage()).toBe('Network error');

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Network error');
  });

  it('should call runHealthCheck when the button is clicked', () => {
    const fixture = TestBed.createComponent(HealthStatusComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    mockGetHealthStatus.mockReturnValue(of({
      status: 'Healthy',
      applicationName: 'App',
      environment: 'Test',
      checkedAtUtc: '2026-04-25T00:00:00Z'
    }));

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    expect(mockGetHealthStatus).toHaveBeenCalledTimes(1);
  });
});
