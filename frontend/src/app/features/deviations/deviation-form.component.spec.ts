import { TestBed } from '@angular/core/testing';
import { DeviationFormComponent } from './deviation-form.component';
import { DeviationModel } from '../../core/models/deviation.model';

const mockDeviation: DeviationModel = {
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  title: 'Existing deviation',
  description: 'Existing description',
  severity: 'Medium',
  status: 'InProgress',
  reportedBy: 'bob',
  reportedAt: '2024-09-01T10:00:00+00:00',
  updatedAt: '2024-09-01T10:00:00+00:00',
};

describe('DeviationFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviationFormComponent],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(DeviationFormComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('form should be invalid when all fields are empty', () => {
    const fixture = TestBed.createComponent(DeviationFormComponent);
    fixture.detectChanges();

    const { form } = fixture.componentInstance;
    form.patchValue({ title: '', description: '', reportedBy: '' });

    expect(form.invalid).toBe(true);
  });

  it('form should be valid when all required fields are filled', () => {
    const fixture = TestBed.createComponent(DeviationFormComponent);
    fixture.detectChanges();

    const { form } = fixture.componentInstance;
    form.patchValue({
      title: 'Valid title',
      description: 'Valid description',
      severity: 'High',
      status: 'Open',
      reportedBy: 'tester',
    });

    expect(form.valid).toBe(true);
  });

  it('title control should be required', () => {
    const fixture = TestBed.createComponent(DeviationFormComponent);
    fixture.detectChanges();

    const titleControl = fixture.componentInstance.form.controls.title;
    titleControl.setValue('');

    expect(titleControl.hasError('required')).toBe(true);
  });

  it('description control should be required', () => {
    const fixture = TestBed.createComponent(DeviationFormComponent);
    fixture.detectChanges();

    const descControl = fixture.componentInstance.form.controls.description;
    descControl.setValue('');

    expect(descControl.hasError('required')).toBe(true);
  });

  it('reportedBy control should be required', () => {
    const fixture = TestBed.createComponent(DeviationFormComponent);
    fixture.detectChanges();

    const reportedByControl = fixture.componentInstance.form.controls.reportedBy;
    reportedByControl.setValue('');

    expect(reportedByControl.hasError('required')).toBe(true);
  });

  it('should emit submitted with form value when form is valid and submitted', () => {
    const fixture = TestBed.createComponent(DeviationFormComponent);
    fixture.detectChanges();

    const { form } = fixture.componentInstance;
    form.patchValue({
      title: 'Submit title',
      description: 'Submit desc',
      severity: 'Critical',
      status: 'Open',
      reportedBy: 'submitter',
    });

    let emittedPayload: unknown;
    fixture.componentInstance.submitted.subscribe((v) => (emittedPayload = v));

    fixture.componentInstance.onSubmit();

    expect(emittedPayload).toEqual({
      title: 'Submit title',
      description: 'Submit desc',
      severity: 'Critical',
      status: 'Open',
      reportedBy: 'submitter',
    });
  });

  it('should not emit submitted when form is invalid', () => {
    const fixture = TestBed.createComponent(DeviationFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ title: '' });

    let emitted = false;
    fixture.componentInstance.submitted.subscribe(() => (emitted = true));

    fixture.componentInstance.onSubmit();

    expect(emitted).toBe(false);
  });

  it('should emit cancelled when cancel button is clicked', () => {
    const fixture = TestBed.createComponent(DeviationFormComponent);
    fixture.detectChanges();

    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));

    const cancelBtn = (fixture.nativeElement as HTMLElement)
      .querySelector('button[type="button"]') as HTMLButtonElement;
    cancelBtn?.click();

    expect(cancelled).toBe(true);
  });
});
