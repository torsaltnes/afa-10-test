import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DeviationFormComponent } from './deviation-form.component';
import { provideHttpClient } from '@angular/common/http';
import { Deviation } from '../../core/models/deviation.model';

const mockDeviation: Deviation = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Existing title',
  description: 'Existing description',
  severity: 'Critical',
  status: 'Investigating',
  createdAtUtc: '2024-08-20T10:00:00+00:00',
  lastModifiedAtUtc: '2024-08-20T10:00:00+00:00',
};

describe('DeviationFormComponent', () => {
  let fixture: ComponentFixture<DeviationFormComponent>;

  function createComponent() {
    fixture = TestBed.createComponent(DeviationFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviationFormComponent],
      providers: [provideHttpClient()],
    }).compileComponents();
  });

  it('should show "New Deviation" heading in create mode', () => {
    createComponent();
    const el = fixture.nativeElement as HTMLElement;
    // The form indicates create mode via its submit button text
    expect(el.textContent).toContain('Create Deviation');
  });

  it('should show "Edit Deviation" heading in edit mode', () => {
    fixture = TestBed.createComponent(DeviationFormComponent);
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('initialValue', mockDeviation);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    // The form indicates edit mode via its submit button text
    expect(el.textContent).toContain('Save Changes');
  });

  it('should patch the form when initialValue is set in edit mode', () => {
    fixture = TestBed.createComponent(DeviationFormComponent);
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('initialValue', mockDeviation);
    fixture.detectChanges();

    const { title, description, severity, status } = fixture.componentInstance.form.getRawValue();
    expect(title).toBe('Existing title');
    expect(description).toBe('Existing description');
    expect(severity).toBe('Critical');
    expect(status).toBe('Investigating');
  });

  it('should not emit submitted when form is invalid', () => {
    createComponent();
    const spy = vi.fn();
    fixture.componentInstance.submitted.subscribe(spy);

    // Leave title empty and submit
    fixture.componentInstance.form.patchValue({ title: '', description: 'D' });
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit normalized payload when form is valid', () => {
    createComponent();
    let emitted: unknown = undefined;
    fixture.componentInstance.submitted.subscribe((v) => (emitted = v));

    fixture.componentInstance.form.patchValue({
      title: '  Padded title  ',
      description: 'Desc',
      severity: 'High',
      status: 'Open',
    });

    fixture.componentInstance.onSubmit();

    expect(emitted).toEqual(
      expect.objectContaining({
        title: 'Padded title',
        description: 'Desc',
        severity: 'High',
      }),
    );
  });

  it('should emit cancelled when cancel button is clicked', () => {
    createComponent();
    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));

    fixture.componentInstance.onCancel();

    expect(cancelled).toBe(true);
  });
});
