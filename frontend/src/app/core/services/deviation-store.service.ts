import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Deviation, UpsertDeviationRequest } from '../models/deviation.model';
import { DeviationApiService } from './deviation-api.service';

export type EditMode = 'view' | 'create' | 'edit';

@Injectable({ providedIn: 'root' })
export class DeviationStoreService {
  private readonly api = inject(DeviationApiService);

  // ── Writable signals ───────────────────────────────────────────────────────
  readonly items = signal<Deviation[]>([]);
  readonly selectedId = signal<string | null>(null);
  readonly mode = signal<EditMode>('view');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly error = signal<string | null>(null);

  // ── Computed signals ───────────────────────────────────────────────────────
  readonly sortedItems = computed(() =>
    [...this.items()].sort(
      (a, b) =>
        new Date(b.lastModifiedAtUtc).getTime() - new Date(a.lastModifiedAtUtc).getTime(),
    ),
  );

  readonly selectedDeviation = computed(() =>
    this.items().find((d) => d.id === this.selectedId()) ?? null,
  );

  readonly isEmpty = computed(() => this.items().length === 0);
  readonly isCreateMode = computed(() => this.mode() === 'create');
  readonly isEditMode = computed(() => this.mode() === 'edit');

  // ── Actions ────────────────────────────────────────────────────────────────

  async load(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);
    try {
      const items = await firstValueFrom(this.api.list());
      this.items.set(items);
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  select(id: string): void {
    this.selectedId.set(id);
    this.mode.set('view');
  }

  startCreate(): void {
    this.selectedId.set(null);
    this.mode.set('create');
    this.error.set(null);
  }

  startEdit(id: string): void {
    this.selectedId.set(id);
    this.mode.set('edit');
    this.error.set(null);
  }

  async save(request: UpsertDeviationRequest): Promise<void> {
    this.error.set(null);
    this.saving.set(true);
    try {
      if (this.mode() === 'create') {
        const created = await firstValueFrom(this.api.create(request));
        this.items.update((list) => [created, ...list]);
        this.selectedId.set(created.id);
        this.mode.set('view');
      } else {
        const id = this.selectedId();
        if (!id) return;
        const updated = await firstValueFrom(
          this.api.update(id, { ...request, id }),
        );
        this.items.update((list) => list.map((d) => (d.id === updated.id ? updated : d)));
        this.mode.set('view');
      }
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }

  async remove(id: string): Promise<void> {
    this.error.set(null);
    this.deleting.set(true);
    try {
      await firstValueFrom(this.api.delete(id));
      this.items.update((list) => list.filter((d) => d.id !== id));
      if (this.selectedId() === id) {
        this.selectedId.set(null);
        this.mode.set('view');
      }
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.deleting.set(false);
    }
  }

  cancelEditing(): void {
    this.mode.set('view');
    this.error.set(null);
  }
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
}
