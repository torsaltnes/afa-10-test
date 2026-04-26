import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DeviationsPageComponent } from './deviations-page.component';
import { DeviationStoreService } from '../../core/services/deviation-store.service';
import { Deviation } from '../../core/models/deviation.model';

const mockDeviation: Deviation = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Missing safety guard',
  description: 'Guard removed from machine 12',
  severity: 'High',
  status: 'Open',
  createdAtUtc: '2024-08-20T10:00:00+00:00',
  lastModifiedAtUtc: '2024-08-20T10:00:00+00:00',
};

describe('DeviationsPageComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviationsPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DeviationStoreService,
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    // Reset store state before each test
    const store = TestBed.inject(DeviationStoreService);
    store.items.set([]);
    store.selectedId.set(null);
    store.mode.set('view');
    store.loading.set(false);
    store.saving.set(false);
    store.deleting.set(false);
    store.error.set(null);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should trigger initial GET /api/deviations on ngOnInit', () => {
    const fixture = TestBed.createComponent(DeviationsPageComponent);
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/deviations');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should show empty state when list is empty', async () => {
    const fixture = TestBed.createComponent(DeviationsPageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/deviations').flush([]);
    await Promise.resolve();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No deviations yet');
  });

  it('should render deviation titles after successful load', async () => {
    const fixture = TestBed.createComponent(DeviationsPageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/deviations').flush([mockDeviation]);
    await Promise.resolve();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Missing safety guard');
  });

  it('should switch to create mode when "+ New Deviation" is clicked', async () => {
    const fixture = TestBed.createComponent(DeviationsPageComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/deviations').flush([]);
    await Promise.resolve();
    fixture.detectChanges();

    const btn = (fixture.nativeElement as HTMLElement).querySelector('button[type="button"]') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    const store = TestBed.inject(DeviationStoreService);
    expect(store.mode()).toBe('create');

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-deviation-form')).not.toBeNull();
  });

  it('should switch to edit mode when Edit is clicked on a selected deviation', async () => {
    const store = TestBed.inject(DeviationStoreService);
    store.items.set([mockDeviation]);
    store.selectedId.set(mockDeviation.id);

    const fixture = TestBed.createComponent(DeviationsPageComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/deviations').flush([mockDeviation]);
    await Promise.resolve();
    fixture.detectChanges();

    const editBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => b.textContent?.trim() === 'Edit') as HTMLButtonElement | undefined;

    editBtn?.click();
    fixture.detectChanges();

    expect(store.mode()).toBe('edit');
  });

  it('should show error banner when load fails', async () => {
    const fixture = TestBed.createComponent(DeviationsPageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/deviations').flush(null, { status: 500, statusText: 'Server Error' });
    await Promise.resolve();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('should remove deviation from list after successful delete', async () => {
    const store = TestBed.inject(DeviationStoreService);
    store.items.set([mockDeviation]);
    store.selectedId.set(mockDeviation.id);

    const fixture = TestBed.createComponent(DeviationsPageComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/deviations').flush([mockDeviation]);
    await Promise.resolve();
    fixture.detectChanges();

    // Trigger remove via store directly (avoiding confirm() dialog in tests)
    const removePromise = store.remove(mockDeviation.id);
    httpMock.expectOne(`/api/deviations/${mockDeviation.id}`).flush(null, { status: 204, statusText: 'No Content' });
    await removePromise;
    fixture.detectChanges();

    expect(store.items()).toHaveLength(0);
    expect(store.selectedId()).toBeNull();
  });
});
