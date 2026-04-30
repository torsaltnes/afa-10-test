import {
  ChangeDetectionStrategy,
  Component,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-topbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-topbar-bg px-4 md:px-6"
    >
      <!-- Hamburger (mobile only) -->
      <button
        type="button"
        class="rounded-md p-2 text-text-secondary transition-colors duration-150
               hover:bg-surface-subtle hover:text-text-primary
               active:bg-surface-muted
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
               lg:hidden"
        (click)="menuToggle.emit()"
        aria-label="Open menu"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
          <rect y="3"    width="18" height="1.5" rx="0.75"/>
          <rect y="8.25" width="18" height="1.5" rx="0.75"/>
          <rect y="13.5" width="18" height="1.5" rx="0.75"/>
        </svg>
      </button>

      <!-- Search bar -->
      <div class="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
        <!-- Search icon -->
        <span
          class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted"
          aria-hidden="true"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="6" cy="6" r="4"/>
            <path d="M9.5 9.5L13 13" stroke-linecap="round"/>
          </svg>
        </span>

        @if (searchExpanded() || true) {
          <input
            type="search"
            placeholder="Search…"
            class="w-full rounded-md border border-border bg-surface-subtle
                   py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-placeholder
                   transition-colors duration-150
                   hover:border-border
                   focus:border-primary/60 focus:bg-surface focus:outline-none
                   focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Search"
          />
        }
      </div>

      <!-- Right-side actions -->
      <div class="ml-auto flex items-center gap-1">

        <!-- Notifications button -->
        <button
          type="button"
          class="relative rounded-md p-2 text-text-secondary transition-colors duration-150
                 hover:bg-surface-subtle hover:text-text-primary
                 active:bg-surface-muted
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Notifications, 1 unread"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
            <path d="M9 1.5a5.5 5.5 0 015.5 5.5v3l1.5 2H2l1.5-2V7A5.5 5.5 0 019 1.5z"/>
            <path d="M7.5 14.5a1.5 1.5 0 003 0"/>
          </svg>
          <!-- Notification dot with white-ring halo for separation -->
          <span
            class="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-topbar-bg"
            aria-hidden="true"
          ></span>
        </button>

        <!-- User avatar button -->
        <button
          type="button"
          class="ml-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary
                 text-xs font-semibold text-button-primary-text
                 transition-all duration-150
                 hover:bg-primary-hover hover:shadow-md
                 active:scale-95
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                 focus-visible:ring-offset-2 focus-visible:ring-offset-topbar-bg"
          aria-label="User menu"
        >
          JD
        </button>
      </div>
    </header>
  `,
})
export class TopbarComponent {
  readonly menuToggle = output<void>();
  protected readonly searchExpanded = signal(false);
}
