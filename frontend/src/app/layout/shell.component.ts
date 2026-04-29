import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';
import { AppShellStore } from './app-shell.store';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <!-- Full-height grid: sidebar | main -->
    <div class="flex h-screen overflow-hidden bg-background">

      <!-- ── Mobile drawer backdrop ──────────────────────────── -->
      @if (shell.sidebarOpen()) {
        <div
          class="fixed inset-0 z-20 bg-black/50 lg:hidden"
          (click)="shell.closeSidebar()"
          aria-hidden="true"
        ></div>
      }

      <!-- ── Sidebar ───────────────────────────────────────────── -->
      <aside
        class="fixed inset-y-0 left-0 z-30 flex w-60 flex-col
               border-r border-border bg-surface
               transition-transform duration-200
               lg:static lg:translate-x-0"
        [class.translate-x-0]="shell.sidebarOpen()"
        [class.-translate-x-full]="!shell.sidebarOpen()"
      >
        <app-sidebar (closeRequest)="shell.closeSidebar()" />
      </aside>

      <!-- ── Main content area ─────────────────────────────────── -->
      <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <!-- Top bar -->
        <app-topbar (menuToggle)="shell.toggleSidebar()" />

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto bg-background">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent {
  protected readonly shell = inject(AppShellStore);
}
