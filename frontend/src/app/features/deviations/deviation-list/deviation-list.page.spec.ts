import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { DeviationListPage } from './deviation-list.page';
import { DeviationListStore } from '../data/deviation-list.store';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

/** Minimal stub for DeviationListStore */
class DeviationListStoreMock {
  searchQuery = signal('');
  statusFilter = signal('');
  severityFilter = signal('');
  typeFilter = signal('');
  sortBy = signal('createdAt');
  sortDir = signal<'asc' | 'desc'>('desc');
  currentPage = signal(1);
  pageSize = signal(10);
  exportLoading = signal(false);

  loading = signal(false);
  error = signal<null | Error>(null);
  items = signal<unknown[]>([]);
  totalCount = signal(0);
  totalPages = signal(0);
  hasNextPage = signal(false);
  hasPreviousPage = signal(false);
  activeFilterCount = signal(0);
  paginationLabel = signal('No results');

  setSearch = jasmine.createSpy('setSearch');
  setStatusFilter = jasmine.createSpy('setStatusFilter');
  setSeverityFilter = jasmine.createSpy('setSeverityFilter');
  setTypeFilter = jasmine.createSpy('setTypeFilter');
  clearFilters = jasmine.createSpy('clearFilters');
  goToPage = jasmine.createSpy('goToPage');
  sort = jasmine.createSpy('sort');
  reload = jasmine.createSpy('reload');
  export = jasmine.createSpy('export');
}

describe('DeviationListPage', () => {
  let fixture: ComponentFixture<DeviationListPage>;
  let mockStore: DeviationListStoreMock;

  beforeEach(async () => {
    mockStore = new DeviationListStoreMock();

    await TestBed.configureTestingModule({
      imports: [DeviationListPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
      // Override the component-scoped provider so our mock is used
      .overrideComponent(DeviationListPage, {
        set: {
          providers: [{ provide: DeviationListStore, useValue: mockStore }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DeviationListPage);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display page heading "Deviations"', () => {
    const h1: HTMLElement = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent?.trim()).toBe('Deviations');
  });

  it('should show empty state when items are empty and not loading', () => {
    // loading is already false in mock
    mockStore.items.set([]);
    fixture.detectChanges();
    const allParagraphs: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll('p');
    const emptyMsg = Array.from(allParagraphs).find((p) =>
      p.textContent?.includes('No deviations found'),
    );
    expect(emptyMsg).toBeTruthy();
  });

  it('should show loading skeleton when loading is true', () => {
    mockStore.loading.set(true);
    fixture.detectChanges();
    const skeleton = fixture.nativeElement.querySelector('.animate-pulse');
    expect(skeleton).toBeTruthy();
  });

  it('should render "New Deviation" link', () => {
    const links: NodeListOf<HTMLAnchorElement> =
      fixture.nativeElement.querySelectorAll('a');
    const newLink = Array.from(links).find((a) =>
      a.textContent?.trim().includes('New Deviation'),
    );
    expect(newLink).toBeTruthy();
  });

  it('should call setSearch when search input fires', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[type="search"]',
    );
    expect(input).toBeTruthy();
    input.value = 'valve';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(mockStore.setSearch).toHaveBeenCalledWith('valve');
  });

  it('should call export() when Export CSV button is clicked', () => {
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('button');
    const exportButton = Array.from(buttons).find((b) =>
      b.textContent?.includes('Export CSV'),
    );
    expect(exportButton).toBeTruthy();
    exportButton!.click();
    expect(mockStore.export).toHaveBeenCalled();
  });

  it('should show "Clear" button when activeFilterCount > 0', () => {
    mockStore.activeFilterCount.set(2);
    mockStore.statusFilter.set('Closed');
    fixture.detectChanges();
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('button');
    const clearBtn = Array.from(buttons).find((b) =>
      b.textContent?.trim().startsWith('Clear'),
    );
    expect(clearBtn).toBeTruthy();
  });

  it('should call clearFilters when Clear button is clicked', () => {
    mockStore.activeFilterCount.set(1);
    mockStore.statusFilter.set('Closed');
    fixture.detectChanges();
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('button');
    const clearBtn = Array.from(buttons).find((b) =>
      b.textContent?.trim().startsWith('Clear'),
    );
    expect(clearBtn).toBeTruthy();
    clearBtn!.click();
    expect(mockStore.clearFilters).toHaveBeenCalled();
  });
});
