import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppShellStore {
  /** Whether the sidebar drawer is open (always true on desktop) */
  readonly sidebarOpen = signal(false);

  openSidebar(): void {
    this.sidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
}
