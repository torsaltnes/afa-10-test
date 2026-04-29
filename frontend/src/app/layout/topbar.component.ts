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
      class="flex h-16 items-center gap-4 border-b border-border bg-surface px-4 md:px-6"
    >
      <!-- Hamburger (mobile) -->
      <button
        class="rounded-md p-2 text-text-secondary transition-colors duration-150
               hover:bg-surface-raised hover:text-text-primary
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
               lg:hidden"
        (click)="menuToggle.emit()"
        aria-label="Open menu"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <rect y="3" width="18" height="1.5" rx="0.75"/>
          <rect y="8.25" width="18" height="1.5" rx="0.75"/>
          <rect y="13.5" width="18" height="1.5" rx="0.75"/>
        </svg>
      </button>

      <!-- Search bar -->
      <div class="relative flex-1 max-w-xs">
        <!-- Search icon -->
        <span
          class="absolute inset-y-0 left-3 flex items-center text-text-secondary pointer-events-none"
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
            class="w-full rounded-lg border border-border bg-surface-raised
                   py-2 pl-9 pr-3 text-body text-text-primary placeholder:text-text-secondary
                   transition-colors duration-150
                   focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Search"
          />
        }
      </div>

      <!-- Right-side actions -->
      <div class="ml-auto flex items-center gap-2">
        <!-- Notifications button -->
        <button
          class="relative rounded-md p-2 text-text-secondary transition-colors duration-150
                 hover:bg-surface-raised hover:text-text-primary
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Notifications"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4">
            <path d="M9 1.5a5.5 5.5 0 015.5 5.5v3l1.5 2H2l1.5-2V7A5.5 5.5 0 019 1.5z"/>
            <path d="M7.5 14.5a1.5 1.5 0 003 0"/>
          </svg>
          <!-- Notification dot -->
          <span
            class="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-danger"
            aria-hidden="true"
          ></span>
        </button>

        <!-- Avatar -->
        <button
          class="flex size-8 items-center justify-center rounded-full bg-primary
                 text-xs font-semibold text-white transition-colors duration-150
                 hover:bg-primary-hover
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
