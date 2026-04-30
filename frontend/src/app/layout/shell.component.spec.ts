import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShellComponent } from './shell.component';

describe('ShellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the shell', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the shell container with semantic theme classes', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    const shell = fixture.nativeElement.firstElementChild as HTMLElement;

    // Root wrapper uses semantic background token — not raw dark utilities
    expect(shell.classList.contains('bg-background')).toBeTrue();
    expect(shell.className).not.toContain('bg-black');
    expect(shell.className).not.toContain('bg-slate');
    expect(shell.className).not.toContain('bg-gray-900');
  });

  it('should render the routed layout structure without initialization errors', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-sidebar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-topbar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('main')).toBeTruthy();
  });

  it('should apply semantic sidebar background token on the aside element', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    const aside = fixture.nativeElement.querySelector('aside') as HTMLElement;
    expect(aside.classList.contains('bg-sidebar-bg')).toBeTrue();
    // Must not use old dark-specific surface token
    expect(aside.className).not.toContain('bg-slate');
    expect(aside.className).not.toContain('bg-gray-900');
  });
});
