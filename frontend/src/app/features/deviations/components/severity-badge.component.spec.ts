import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SeverityBadgeComponent } from './severity-badge.component';
import { DeviationSeverity } from '../../../core/models/deviation.model';

describe('SeverityBadgeComponent', () => {
  let fixture: ComponentFixture<SeverityBadgeComponent>;
  let component: SeverityBadgeComponent;

  function createWithSeverity(severity: DeviationSeverity): void {
    TestBed.configureTestingModule({
      imports: [SeverityBadgeComponent],
    }).overrideComponent(SeverityBadgeComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default },
    });

    fixture = TestBed.createComponent(SeverityBadgeComponent);
    fixture.componentRef.setInput('severity', severity);
    fixture.detectChanges();
    component = fixture.componentInstance;
  }

  it('should render "Critical" label for Critical severity', () => {
    createWithSeverity('Critical');
    const el: HTMLElement = fixture.nativeElement.querySelector('span');
    expect(el.textContent?.trim()).toBe('Critical');
    expect(el.className).toContain('bg-danger/20');
    expect(el.className).toContain('text-danger');
  });

  it('should render "High" label for High severity', () => {
    createWithSeverity('High');
    const el: HTMLElement = fixture.nativeElement.querySelector('span');
    expect(el.textContent?.trim()).toBe('High');
    expect(el.className).toContain('bg-danger/10');
  });

  it('should render "Medium" label for Medium severity', () => {
    createWithSeverity('Medium');
    const el: HTMLElement = fixture.nativeElement.querySelector('span');
    expect(el.textContent?.trim()).toBe('Medium');
    expect(el.className).toContain('bg-warning/15');
    expect(el.className).toContain('text-warning');
  });

  it('should render "Low" label for Low severity', () => {
    createWithSeverity('Low');
    const el: HTMLElement = fixture.nativeElement.querySelector('span');
    expect(el.textContent?.trim()).toBe('Low');
    expect(el.className).toContain('bg-primary/10');
    expect(el.className).toContain('text-primary');
  });
});

describe('SeverityBadgeComponent – badgeClass computed', () => {
  it('returns distinct classes for each severity', () => {
    const severities: DeviationSeverity[] = ['Critical', 'High', 'Medium', 'Low'];

    TestBed.configureTestingModule({ imports: [SeverityBadgeComponent] });

    const classes = severities.map((sev) => {
      const fixture = TestBed.createComponent(SeverityBadgeComponent);
      fixture.componentRef.setInput('severity', sev);
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('span').className as string;
    });

    // All four should be distinct
    const unique = new Set(classes);
    expect(unique.size).toBe(4);
  });
});
