import { TestBed } from '@angular/core/testing';
import { EducationFormComponent } from './education-form.component';

describe('EducationFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EducationFormComponent],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(EducationFormComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('form should be invalid when required fields are blank', () => {
    const fixture = TestBed.createComponent(EducationFormComponent);
    fixture.detectChanges();

    const { form } = fixture.componentInstance;
    form.patchValue({ degree: '', institution: '' });

    expect(form.invalid).toBe(true);
  });

  it('form should be valid when all required fields are filled', () => {
    const fixture = TestBed.createComponent(EducationFormComponent);
    fixture.detectChanges();

    const { form } = fixture.componentInstance;
    form.patchValue({ degree: 'BSc', institution: 'MIT', graduationYear: 2015 });

    expect(form.valid).toBe(true);
  });

  it('degree control should be required', () => {
    const fixture = TestBed.createComponent(EducationFormComponent);
    fixture.detectChanges();

    const ctrl = fixture.componentInstance.form.controls.degree;
    ctrl.setValue('');

    expect(ctrl.hasError('required')).toBe(true);
  });

  it('institution control should be required', () => {
    const fixture = TestBed.createComponent(EducationFormComponent);
    fixture.detectChanges();

    const ctrl = fixture.componentInstance.form.controls.institution;
    ctrl.setValue('');

    expect(ctrl.hasError('required')).toBe(true);
  });

  it('graduationYear must be >= 1900', () => {
    const fixture = TestBed.createComponent(EducationFormComponent);
    fixture.detectChanges();

    const ctrl = fixture.componentInstance.form.controls.graduationYear;
    ctrl.setValue(1800);

    expect(ctrl.hasError('min')).toBe(true);
  });

  it('should emit submitted with correct payload when valid', () => {
    const fixture = TestBed.createComponent(EducationFormComponent);
    fixture.detectChanges();

    const { form } = fixture.componentInstance;
    form.patchValue({ degree: 'PhD', institution: 'Harvard', graduationYear: 2022 });

    let emitted: unknown;
    fixture.componentInstance.submitted.subscribe((v) => (emitted = v));

    fixture.componentInstance.onSubmit();

    expect(emitted).toEqual({ degree: 'PhD', institution: 'Harvard', graduationYear: 2022 });
  });

  it('should not emit submitted when form is invalid', () => {
    const fixture = TestBed.createComponent(EducationFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ degree: '', institution: '' });

    let emitted = false;
    fixture.componentInstance.submitted.subscribe(() => (emitted = true));

    fixture.componentInstance.onSubmit();

    expect(emitted).toBe(false);
  });

  it('should emit cancelled when Cancel button is clicked', () => {
    const fixture = TestBed.createComponent(EducationFormComponent);
    fixture.detectChanges();

    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));

    const cancelBtn = (fixture.nativeElement as HTMLElement)
      .querySelector('button[type="button"]') as HTMLButtonElement;
    cancelBtn?.click();

    expect(cancelled).toBe(true);
  });
});
