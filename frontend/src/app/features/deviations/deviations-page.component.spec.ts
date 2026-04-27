import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DeviationsPageComponent } from './deviations-page.component';
import { DeviationModel } from '../../core/models/deviation.model';

const mockDeviations: DeviationModel[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Mislabelled batch',
    description: 'Batch 99 label missing',
    severity: 'High',
    status: 'Open',
    reportedBy: 'alice',
    reportedAt: '2024-09-01T10:00:00+00:00',
    updatedAt: '2024-09-01T10:00:00+00:00',
  },
];

describe('DeviationsPageComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviationsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(DeviationsPageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/deviations').flush([]);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show loading spinner while fetching', () => {
    const fixture = TestBed.createComponent(DeviationsPageComponent);
    fixture.detectChanges(); // triggers ngOnInit → isLoading = true

    const spinner = (fixture.nativeElement as HTMLElement).querySelector('[role="status"]');
    expect(spinner).not.toBeNull();

    httpMock.expectOne('/api/deviations').flush([]);
  });

  it('should render the empty state when no deviations exist', async () => {
    const fixture = TestBed.createComponent(DeviationsPageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/deviations').flush([]);

    await Promise.resolve();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No deviations yet');
  });

  it('should render the list when deviations exist', async () => {
    const fixture = TestBed.createComponent(DeviationsPageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/deviations').flush(mockDeviations);

    await Promise.resolve();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Mislabelled batch');
  });

  it('should show error banner on API failure', async () => {
    const fixture = TestBed.createComponent(DeviationsPageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/deviations').flush(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });

    await Promise.resolve();
    fixture.detectChanges();

    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
  });

  it('should open the editor panel when "New deviation" is clicked', async () => {
    const fixture = TestBed.createComponent(DeviationsPageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/deviations').flush([]);
    await Promise.resolve();
    fixture.detectChanges();

    const btn = (fixture.nativeElement as HTMLElement)
      .querySelector('button') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
  });

  it('should open delete confirmation when delete button is clicked', async () => {
    const fixture = TestBed.createComponent(DeviationsPageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/deviations').flush(mockDeviations);
    await Promise.resolve();
    fixture.detectChanges();

    // Click the Delete action button in the list
    const buttons = (fixture.nativeElement as HTMLElement)
      .querySelectorAll('button');
    const deleteBtn = Array.from(buttons).find(
      (b) => b.textContent?.trim() === 'Delete'
    ) as HTMLButtonElement;
    deleteBtn?.click();
    fixture.detectChanges();

    const alertDialog = (fixture.nativeElement as HTMLElement)
      .querySelector('[role="alertdialog"]');
    expect(alertDialog).not.toBeNull();
  });

  it('should hide delete confirmation when Cancel is clicked', async () => {
    const fixture = TestBed.createComponent(DeviationsPageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/deviations').flush(mockDeviations);
    await Promise.resolve();
    fixture.detectChanges();

    // Open delete confirmation
    fixture.componentInstance.requestDelete(mockDeviations[0].id);
    fixture.detectChanges();

    expect(fixture.componentInstance.pendingDeleteId()).toBe(mockDeviations[0].id);

    fixture.componentInstance.cancelDelete();
    fixture.detectChanges();

    expect(fixture.componentInstance.pendingDeleteId()).toBeNull();
  });

  it('editorMode should switch to edit when openEditEditor is called', async () => {
    const fixture = TestBed.createComponent(DeviationsPageComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/deviations').flush(mockDeviations);
    await Promise.resolve();
    fixture.detectChanges();

    fixture.componentInstance.openEditEditor(mockDeviations[0]);
    fixture.detectChanges();

    expect(fixture.componentInstance.editorMode()).toBe('edit');
    expect(fixture.componentInstance.editingDeviation()).toEqual(mockDeviations[0]);
  });
});
