import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-users-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-6 p-4 md:p-6">
      <h1 class="text-heading font-semibold text-balance text-text-primary">Users</h1>
      <div class="rounded-xl border border-border bg-surface p-8 text-center">
        <p class="text-body text-text-secondary">
          Users module — coming soon.
        </p>
      </div>
    </div>
  `,
})
export class UsersPage {}
