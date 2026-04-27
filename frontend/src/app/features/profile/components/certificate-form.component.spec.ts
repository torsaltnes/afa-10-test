import { TestBed } from '@angular/core/testing';
import { CertificateFormComponent } from './certificate-form.component';

describe('CertificateFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificateFormComponent],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(CertificateFormComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('form should be invalid when required fields are blank', () => {
    const fixture = TestBed.createComponent(CertificateFormComponent);
    fixture.detectChanges();

    const { form } = fixture.componentInstance;
    form.patchValue({ certificateName: '', issuingOrganization: '', dateEarned: '' });

    expect(form.invalid).toBe(true);
  });

  it('form should be valid when all required fields are filled', () => {
    const fixture = TestBed.createComponent(CertificateFormComponent);
    fixture.detectChanges();

    const { form } = fixture.componentInstance;
    form.patchValue({
      certificateName: 'AWS SA',
      issuingOrganization: 'Amazon',
      dateEarned: '2022-03-10',
    });

    expect(form.valid).toBe(true);
  });

  it('certificateName control should be required', () => {
    const fixture = TestBed.createComponent(CertificateFormComponent);
    fixture.detectChanges();

    const ctrl = fixture.componentInstance.form.controls.certificateName;
    ctrl.setValue('');

    expect(ctrl.hasError('required')).toBe(true);
  });

  it('should emit submitted with correct payload when valid', () => {
    const fixture = TestBed.createComponent(CertificateFormComponent);
    fixture.detectChanges();

    const { form } = fixture.componentInstance;
    form.patchValue({ certificateName: 'GCP Pro', issuingOrganization: 'Google', dateEarned: '2023-01-01' });

    let emitted: unknown;
    fixture.componentInstance.submitted.subscribe((v) => (emitted = v));

    fixture.componentInstance.onSubmit();

    expect(emitted).toEqual({
      certificateName: 'GCP Pro',
      issuingOrganization: 'Google',
      dateEarned: '2023-01-01',
    });
  });

  it('should emit cancelled when Cancel button is clicked', () => {
    const fixture = TestBed.createComponent(CertificateFormComponent);
    fixture.detectChanges();

    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));

    const cancelBtn = (fixture.nativeElement as HTMLElement)
      .querySelector('button[type="button"]') as HTMLButtonElement;
    cancelBtn?.click();

    expect(cancelled).toBe(true);
  });
});
