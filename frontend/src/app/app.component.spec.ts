import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { HealthApiService } from './core/services/health-api.service';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('AppComponent', () => {
  const mockHealthApiService = {
    getHealthStatus: vi.fn().mockReturnValue(of({
      status: 'Healthy',
      applicationName: 'App',
      environment: 'Test',
      checkedAtUtc: '2026-04-25T00:00:00Z'
    }))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: HealthApiService, useValue: mockHealthApiService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the page title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Greenfield');
  });

  it('should include the health status component host element', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('app-health-status')).not.toBeNull();
  });
});
