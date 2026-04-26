import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DeviationListComponent } from './deviation-list.component';
import { DeviationStore } from '../data/deviation.store';
import { signal } from '@angular/core';
import { Deviation } from '../../../core/models/deviation.model';

const mockDeviations: Deviation[] = [
  {
    id: '1',
    title: 'Test Deviation 1',
    description: 'Desc 1',
    severity: 'High',
    status: 'Open',
    reportedBy: 'Alice',
    occurredAt: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Test Deviation 2',
    description: 'Desc 2',
    severity: 'Low',
    status: 'Resolved',
    reportedBy: 'Bob',
    occurredAt: '2024-02-01T00:00:00Z',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  }
];

function createStoreMock(overrides: Partial<{
  deviations: Deviation[];
  loading: boolean;
  error: string | null;
}> = {}) {
  const data = { deviations: [], loading: false, error: null, ...overrides };
  return {
    deviations: signal(data.deviations),
    loading: signal(data.loading),
    error: signal(data.error),
    saving: signal(false),
    hasItems: signal(data.deviations.length > 0),
    isEmpty: signal(!data.loading && data.deviations.length === 0),
    loadAll: jasmine.createSpy('loadAll'),
    remove: jasmine.createSpy('remove').and.returnValue(Promise.resolve(true))
  };
}

describe('DeviationListComponent', () => {
  let fixture: ComponentFixture<DeviationListComponent>;
  let component: DeviationListComponent;
  let storeMock: ReturnType<typeof createStoreMock>;

  async function setup(overrides: Partial<{ deviations: Deviation[]; loading: boolean; error: string | null }> = {}) {
    storeMock = createStoreMock(overrides);
    await TestBed.configureTestingModule({
      imports: [DeviationListComponent],
      providers: [
        provideRouter([]),
        { provide: DeviationStore, useValue: storeMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeviationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('should call loadAll on init', async () => {
    await setup();
    expect(storeMock.loadAll).toHaveBeenCalled();
  });

  it('should render list when deviations exist', async () => {
    await setup({ deviations: mockDeviations });
    const cards = fixture.nativeElement.querySelectorAll('.card');
    // At least two cards (list items)
    const titles = fixture.nativeElement.querySelectorAll('h2');
    expect(titles.length).toBeGreaterThanOrEqual(2);
  });

  it('should show empty state when no deviations', async () => {
    await setup({ deviations: [] });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('No deviations yet');
  });

  it('should show loading state', async () => {
    await setup({ loading: true });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Loading');
  });

  it('should show error state', async () => {
    await setup({ error: 'Network error' });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Network error');
  });

  it('trackById should return item id', async () => {
    await setup();
    expect(component.trackById(0, mockDeviations[0])).toBe('1');
  });
});
