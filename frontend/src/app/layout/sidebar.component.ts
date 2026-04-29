import {
  ChangeDetectionStrategy,
  Component,
  output,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', route: '/', icon: 'dashboard', exact: true },
  { label: 'Deviations', route: '/deviations', icon: 'deviations', exact: false },
  { label: 'Analytics', route: '/analytics', icon: 'analytics', exact: false },
  { label: 'Reports', route: '/reports', icon: 'reports', exact: false },
  { label: 'Users', route: '/users', icon: 'users', exact: false },
  { label: 'Settings', route: '/settings', icon: 'settings', exact: false },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-full flex-col">

      <!-- ── Brand ─────────────────────────────────────────────── -->
      <div class="flex h-16 items-center gap-3 border-b border-border px-5">
        <div
          class="flex size-8 items-center justify-center rounded-lg bg-primary text-white"
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1L15 5v6l-7 4L1 11V5z"/>
          </svg>
        </div>
        <span class="text-sm font-semibold text-text-primary">Greenfield</span>

        <!-- Mobile close button -->
        <button
          class="ml-auto rounded-md p-1 text-text-secondary transition-colors duration-150
                 hover:bg-surface-raised hover:text-text-primary
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                 lg:hidden"
          (click)="closeRequest.emit()"
          aria-label="Close menu"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.78 4.28L11.72 3.22 8 6.94 4.28 3.22 3.22 4.28 6.94 8l-3.72 3.72 1.06 1.06L8 9.06l3.72 3.72 1.06-1.06L9.06 8z"/>
          </svg>
        </button>
      </div>

      <!-- ── Navigation ─────────────────────────────────────────── -->
      <nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Main navigation">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-surface-raised text-text-primary"
            [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-body
                   text-text-secondary transition-colors duration-150
                   hover:bg-surface-raised hover:text-text-primary
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span aria-hidden="true" class="size-4 shrink-0">
              @switch (item.icon) {
                @case ('dashboard') {
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="1" width="6" height="6" rx="1"/>
                    <rect x="9" y="1" width="6" height="6" rx="1"/>
                    <rect x="1" y="9" width="6" height="6" rx="1"/>
                    <rect x="9" y="9" width="6" height="6" rx="1"/>
                  </svg>
                }
                @case ('deviations') {
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2">
                    <path d="M8 2l6 10H2L8 2z" stroke-linejoin="round"/>
                    <path d="M8 6v3M8 11h.01" stroke-linecap="round"/>
                  </svg>
                }
                @case ('analytics') {
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1 14L5 9l3 3 3-4 3-2" stroke="currentColor" stroke-width="1.5"
                          fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                }
                @case ('reports') {
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M3 1h7l3 3v11H3V1z" stroke="currentColor" stroke-width="1" fill="none"/>
                    <path d="M10 1v3h3"/>
                    <line x1="5" y1="7" x2="11" y2="7" stroke="currentColor" stroke-width="1.2"/>
                    <line x1="5" y1="10" x2="11" y2="10" stroke="currentColor" stroke-width="1.2"/>
                  </svg>
                }
                @case ('users') {
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="6" cy="5" r="3" stroke="currentColor" stroke-width="1" fill="none"/>
                    <path d="M1 14c0-3 2-5 5-5s5 2 5 5" stroke="currentColor" stroke-width="1" fill="none"/>
                    <circle cx="12" cy="5" r="2" stroke="currentColor" stroke-width="1" fill="none"/>
                    <path d="M12 10c2 0 3 1.5 3 4" stroke="currentColor" stroke-width="1" fill="none"/>
                  </svg>
                }
                @case ('settings') {
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1" fill="none"/>
                    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"
                          stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                  </svg>
                }
              }
            </span>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- ── User profile ───────────────────────────────────────── -->
      <div class="border-t border-border p-3">
        <div
          class="flex items-center gap-3 rounded-lg px-3 py-2
                 transition-colors duration-150 hover:bg-surface-raised
                 cursor-default"
        >
          <div
            class="flex size-8 shrink-0 items-center justify-center rounded-full
                   bg-primary text-xs font-semibold text-white"
            aria-hidden="true"
          >
            JD
          </div>
          <div class="min-w-0">
            <p class="truncate text-caption font-medium text-text-primary">Jane Doe</p>
            <p class="truncate text-caption text-text-secondary">jane@example.com</p>
          </div>
        </div>
      </div>

    </div>
  `,
})
export class SidebarComponent {
  readonly closeRequest = output<void>();
  protected readonly navItems = NAV_ITEMS;
}
