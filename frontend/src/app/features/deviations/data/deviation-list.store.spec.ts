import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DeviationListStore } from './deviation-list.store';
import { DeviationApiService } from '../../../core/services/deviation-api.service';
import {
  DeviationDto,
  DeviationStatus,
  DeviationSeverity,
  DeviationType,
} from '../../../core/models/deviation.model';

function makeDeviation(overrides: Partial<DeviationDto> = {}): DeviationDto {
  return {
    id: '1',
    referenceNumber: 'DEV-2026-001',
    title: 'Test Deviation',
    description: 'A test deviation',
    type: 'Deviation' as DeviationType,
    severity: 'Medium' as DeviationSeverity,
    status: 'Registered' as DeviationStatus,
    reportedBy: 'Jane Doe',
    assignedTo: null,
    location: 'Warehouse A',
    department: 'Quality',
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
    dueDate: null,
    closedAt: null,
    attachmentCount: 0,
    ...overrides,
  };
}

describe('DeviationListStore', () => {
  let store: DeviationListStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DeviationListStore,
        DeviationApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    // Run in injection context to allow toObservable side-effect
    store = TestBed.runInInjectionContext(() => TestBed.inject(DeviationListStore));
  });

  it('should create with default signal values', () => {
    expect(store).toBeTruthy();
    expect(store.searchQuery()).toBe('');
    expect(store.statusFilter()).toBe('');
    expect(store.severityFilter()).toBe('');
    expect(store.typeFilter()).toBe('');
    expect(store.currentPage()).toBe(1);
    expect(store.pageSize()).toBe(10);
    expect(store.sortBy()).toBe('createdAt');
    expect(store.sortDir()).toBe('desc');
  });

  it('setSearch() updates searchQuery and resets page', () => {
    store['currentPage'].set(3);
    store.setSearch('test query');
    expect(store.searchQuery()).toBe('test query');
    expect(store.currentPage()).toBe(1);
  });

  it('setStatusFilter() updates statusFilter and resets page', () => {
    store['currentPage'].set(2);
    store.setStatusFilter('Assessed');
    expect(store.statusFilter()).toBe('Assessed');
    expect(store.currentPage()).toBe(1);
  });

  it('setSeverityFilter() updates severityFilter and resets page', () => {
    store['currentPage'].set(2);
    store.setSeverityFilter('Critical');
    expect(store.severityFilter()).toBe('Critical');
    expect(store.currentPage()).toBe(1);
  });

  it('setTypeFilter() updates typeFilter and resets page', () => {
    store['currentPage'].set(2);
    store.setTypeFilter('Incident');
    expect(store.typeFilter()).toBe('Incident');
    expect(store.currentPage()).toBe(1);
  });

  it('clearFilters() resets all filters and page', () => {
    store.setStatusFilter('Closed');
    store.setSeverityFilter('High');
    store.setTypeFilter('NearMiss');
    store.setSearch('something');
    store['currentPage'].set(3);

    store.clearFilters();

    expect(store.statusFilter()).toBe('');
    expect(store.severityFilter()).toBe('');
    expect(store.typeFilter()).toBe('');
    expect(store.searchQuery()).toBe('');
    expect(store.currentPage()).toBe(1);
  });

  it('activeFilterCount() reflects number of active filters', () => {
    expect(store.activeFilterCount()).toBe(0);
    store.setStatusFilter('Registered');
    expect(store.activeFilterCount()).toBe(1);
    store.setSeverityFilter('High');
    expect(store.activeFilterCount()).toBe(2);
    store.setTypeFilter('Incident');
    expect(store.activeFilterCount()).toBe(3);
    store.clearFilters();
    expect(store.activeFilterCount()).toBe(0);
  });

  it('sort() toggles direction when same column', () => {
    store['sortBy'].set('createdAt');
    store['sortDir'].set('desc');

    store.sort('createdAt');
    expect(store.sortDir()).toBe('asc');

    store.sort('createdAt');
    expect(store.sortDir()).toBe('desc');
  });

  it('sort() changes column and sets asc when different column', () => {
    store['sortBy'].set('createdAt');
    store.sort('severity');
    expect(store.sortBy()).toBe('severity');
    expect(store.sortDir()).toBe('asc');
  });

  it('goToPage() only changes page within valid range', () => {
    store['currentPage'].set(1);
    // totalPages is 0 initially, so page 2 is out of range
    store.goToPage(0);
    expect(store.currentPage()).toBe(1); // unchanged (0 is invalid)
  });

  it('paginationLabel() shows "No results" when totalCount is 0', () => {
    expect(store.paginationLabel()).toBe('No results');
  });

  it('hasPreviousPage() is false on page 1', () => {
    store['currentPage'].set(1);
    expect(store.hasPreviousPage()).toBeFalse();
  });

  it('hasPreviousPage() is true on page > 1', () => {
    store['currentPage'].set(2);
    expect(store.hasPreviousPage()).toBeTrue();
  });

  it('items() defaults to empty array', () => {
    expect(store.items()).toEqual([]);
  });

  it('sort() resets page to 1', () => {
    store['currentPage'].set(3);
    store.sort('title');
    expect(store.currentPage()).toBe(1);
  });
});
