import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLinkActive } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
  });

  it('should create the sidebar', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the navigation and brand content', () => {
    expect(fixture.nativeElement.querySelector('nav[aria-label="Main navigation"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Greenfield');
    expect(fixture.nativeElement.textContent).toContain('Dashboard');
  });

  it('should bind RouterLinkActive with brand primary active classes on every nav link', () => {
    const linkDEs = fixture.debugElement.queryAll(By.directive(RouterLinkActive));
    expect(linkDEs.length).toBeGreaterThan(0);

    for (const de of linkDEs) {
      const rla = de.injector.get(RouterLinkActive);
      // Angular 20 stores the active class list in the private `classes` field;
      // there is no public getter in this version.
      const activeClasses: string[] = (rla as unknown as { classes: string[] })['classes'];
      const joined = activeClasses.join(' ');

      expect(joined).withContext(`routerLinkActive classes on "${de.nativeElement.textContent?.trim()}"`)
        .toContain('bg-primary');
      expect(joined).withContext(`routerLinkActive classes on "${de.nativeElement.textContent?.trim()}"`)
        .toContain('text-button-primary-text');
      // Ensure no legacy dark-theme or raw surface-raised active binding remains
      expect(joined).not.toContain('bg-slate');
      expect(joined).not.toContain('bg-surface-raised');
    }
  });

  it('should apply semantic inactive and hover classes on all nav links', () => {
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('nav a'),
    ) as HTMLAnchorElement[];
    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      const cls = link.className;
      expect(cls)
        .withContext(`inactive text on "${link.textContent?.trim()}"`)
        .toContain('text-text-secondary');
      expect(cls)
        .withContext(`hover bg on "${link.textContent?.trim()}"`)
        .toContain('hover:bg-surface');
      expect(cls)
        .withContext(`hover text on "${link.textContent?.trim()}"`)
        .toContain('hover:text-text-primary');
    }
  });

  it('should render the mobile close control with semantic classes', () => {
    const closeButton = fixture.nativeElement.querySelector(
      'button[aria-label="Close menu"]',
    ) as HTMLButtonElement;
    expect(closeButton).toBeTruthy();
    expect(closeButton.className).toContain('text-text-secondary');
    expect(closeButton.className).toContain('hover:bg-surface-raised');
  });

  it('should not expose dark-theme-only utility classes anywhere in the template', () => {
    const classNames = Array.from(fixture.nativeElement.querySelectorAll('*'))
      .map((el) => (el as Element).getAttribute('class') ?? '')
      .join(' ');

    expect(classNames).not.toContain('bg-slate');
    expect(classNames).not.toContain('bg-gray-700');
    expect(classNames).not.toContain('bg-gray-900');
    expect(classNames).not.toContain('text-slate');
    expect(classNames).not.toContain('border-slate');
  });
});
