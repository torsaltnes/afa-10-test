import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { DeviationFormComponent } from './deviation-form.component';
import { DeviationStore } from '../data/deviation.store';
import { signal } from '@angular/core';
import { Deviation } from '../../../core/models/deviation.model';

const mockDeviation: Deviation = {
  id: 'test-id',
  title: 'Existing Title',
  description: 'Existing Desc',
  severity: 'High',
  status: 'InProgress',
  reportedBy: 'Alice',
  occurredAt: '2024-03-15T00:00:00Z',
  createdAt: '2024-03-15T00:00:00Z',
  updatedAt: '2024-03-15T00:00:00Z'
};

function createStoreMock(selectedDev: Deviation | null = null) {
  return {
    loading: signal(false),
    saving: signal(false),
    error: signal<string | null>(null),
    selectedDeviation: signal<Deviation | null>(selectedDev),
    loadById: jasmine.createSpy('loadById'),
    create: jasmine.createSpy('create').and.returnValue(Promise.resolve(mockDeviation)),
    update: jasmine.createSpy('update').and.returnValue(Promise.resolve(mockDeviation))
  };
}

describe('DeviationFormComponent – create mode', () => {
  let fixture: ComponentFixture<DeviationFormComponent>;
  let component: DeviationFormComponent;
  let storeMock: ReturnType<typeof createStoreMock>;
  let router: Router;

  beforeEach(async () => {
    storeMock = createStoreMock();
    await TestBed.configureTestingModule({
      imports: [DeviationFormComponent, ReactiveFormsModule],
      providers: [
        provideRouter([{ path: 'deviations', redirectTo: '' }]),
        { provide: DeviationStore, useValue: storeMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(DeviationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be in create mode', () => {
    expect(component.isEditMode).toBeFalse();
  });

  it('form should be invalid when empty title', () => {
    component.form.get('title')!.setValue('');
    expect(component.form.get('title')!.invalid).toBeTrue();
  });

  it('form should be valid with required fields filled', () => {
    component.form.setValue({
      title: 'Test Title',
      description: '',
      severity: 'Low',
      status: 'Open',
      reportedBy: 'Jane',
      occurredAt: '2024-01-01'
    });
    expect(component.form.valid).toBeTrue();
  });

  it('submit should mark form touched if invalid', async () => {
    component.form.get('title')!.setValue('');
    await component.submit();
    expect(component.form.get('title')!.touched).toBeTrue();
    expect(storeMock.create).not.toHaveBeenCalled();
  });

  it('submit should call store.create on valid form', async () => {
    component.form.setValue({
      title: 'New Title',
      description: 'Desc',
      severity: 'Medium',
      status: 'Open',
      reportedBy: 'User',
      occurredAt: '2024-01-15'
    });
    await component.submit();
    expect(storeMock.create).toHaveBeenCalled();
  });

  it('should show required validation message', () => {
    component.form.get('title')!.markAsTouched();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Title is required');
  });
});

describe('DeviationFormComponent – edit mode', () => {
  let fixture: ComponentFixture<DeviationFormComponent>;
  let component: DeviationFormComponent;
  let storeMock: ReturnType<typeof createStoreMock>;
  let router: Router;

  beforeEach(async () => {
    storeMock = createStoreMock(mockDeviation);
    await TestBed.configureTestingModule({
      imports: [DeviationFormComponent, ReactiveFormsModule],
      providers: [
        provideRouter([{ path: 'deviations', redirectTo: '' }]),
        { provide: DeviationStore, useValue: storeMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'test-id' } } }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(DeviationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be in edit mode', () => {
    expect(component.isEditMode).toBeTrue();
  });

  it('should call loadById on init', () => {
    expect(storeMock.loadById).toHaveBeenCalledWith('test-id');
  });

  it('should prefill form with existing deviation via effect', () => {
    // The store mock has selectedDeviation already set to mockDeviation
    // After detectChanges the effect should have fired
    expect(component.form.get('title')!.value).toBe('Existing Title');
    expect(component.form.get('reportedBy')!.value).toBe('Alice');
  });

  it('submit should call store.update in edit mode', async () => {
    // Ensure form is valid (prefilled by effect)
    component.form.patchValue({ title: 'Updated Title' });
    await component.submit();
    expect(storeMock.update).toHaveBeenCalledWith('test-id', jasmine.any(Object));
  });
});
