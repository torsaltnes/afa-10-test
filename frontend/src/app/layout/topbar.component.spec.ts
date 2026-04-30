import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TopbarComponent } from './topbar.component';

describe('TopbarComponent', () => {
  let fixture: ComponentFixture<TopbarComponent>;
  let consoleErrorSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    consoleErrorSpy = spyOn(console, 'error');
    fixture = TestBed.createComponent(TopbarComponent);
    fixture.detectChanges();
  });

  it('should create the topbar without console errors', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should render the header with semantic surface and border tokens', () => {
    const header = fixture.nativeElement.querySelector('header') as HTMLElement;

    // Topbar uses dedicated topbar-bg surface token
    expect(header.className).toContain('bg-topbar-bg');
    expect(header.className).toContain('border-border');

    // Must not use raw dark-specific utilities
    expect(header.className).not.toContain('bg-slate');
    expect(header.className).not.toContain('bg-gray-900');
    expect(header.className).not.toContain('bg-black');
  });

  it('should apply semantic classes to the menu toggle and avatar buttons', () => {
    const menuButton = fixture.nativeElement.querySelector(
      'button[aria-label="Open menu"]',
    ) as HTMLButtonElement;
    const avatarButton = fixture.nativeElement.querySelector(
      'button[aria-label="User menu"]',
    ) as HTMLButtonElement;

    // Menu button: secondary text, subtle hover background
    expect(menuButton.className).toContain('text-text-secondary');
    expect(menuButton.className).toContain('hover:bg-surface-subtle');

    // Avatar button: primary brand colour with accessible foreground
    expect(avatarButton.className).toContain('bg-primary');
    expect(avatarButton.className).toContain('hover:bg-primary-hover');
    expect(avatarButton.className).toContain('text-button-primary-text');
  });

  it('should render the search field with semantic placeholder token', () => {
    const input = fixture.nativeElement.querySelector(
      'input[type="search"]',
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    // The design system uses text-text-placeholder for input placeholder styling
    expect(input.className).toContain('placeholder:text-text-placeholder');
    expect(input.className).toContain('text-text-primary');
  });

  it('should render secondary-text elements for icon affordances', () => {
    const secondaryEl = fixture.nativeElement.querySelector('.text-text-secondary');
    expect(secondaryEl).toBeTruthy();
  });
});
