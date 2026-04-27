import { TestBed } from '@angular/core/testing';
import { CourseFormComponent } from './course-form.component';

describe('CourseFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseFormComponent],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(CourseFormComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('form should be invalid when required fields are blank', () => {
    const fixture = TestBed.createComponent(CourseFormComponent);
    fixture.detectChanges();

    const { form } = fixture.componentInstance;
    form.patchValue({ courseName: '', provider: '', completionDate: '' });

    expect(form.invalid).toBe(true);
  });

  it('form should be valid when all required fields are filled', () => {
    const fixture = TestBed.createComponent(CourseFormComponent);
    fixture.detectChanges();

    const { form } = fixture.componentInstance;
    form.patchValue({ courseName: 'Docker', provider: 'Udemy', completionDate: '2023-07-20' });

    expect(form.valid).toBe(true);
  });

  it('courseName control should be required', () => {
    const fixture = TestBed.createComponent(CourseFormComponent);
    fixture.detectChanges();

    const ctrl = fixture.componentInstance.form.controls.courseName;
    ctrl.setValue('');

    expect(ctrl.hasError('required')).toBe(true);
  });

  it('should emit submitted with correct payload when valid', () => {
    const fixture = TestBed.createComponent(CourseFormComponent);
    fixture.detectChanges();

    const { form } = fixture.componentInstance;
    form.patchValue({ courseName: 'Kubernetes', provider: 'Pluralsight', completionDate: '2024-01-15' });

    let emitted: unknown;
    fixture.componentInstance.submitted.subscribe((v) => (emitted = v));

    fixture.componentInstance.onSubmit();

    expect(emitted).toEqual({
      courseName: 'Kubernetes',
      provider: 'Pluralsight',
      completionDate: '2024-01-15',
    });
  });

  it('should emit cancelled when Cancel button is clicked', () => {
    const fixture = TestBed.createComponent(CourseFormComponent);
    fixture.detectChanges();

    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));

    const cancelBtn = (fixture.nativeElement as HTMLElement)
      .querySelector('button[type="button"]') as HTMLButtonElement;
    cancelBtn?.click();

    expect(cancelled).toBe(true);
  });
});
