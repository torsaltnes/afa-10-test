import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DeviationApiService } from '../../core/services/deviation-api.service';
import {
  CreateDeviationPayload,
  DeviationModel,
  UpdateDeviationPayload,
} from '../../core/models/deviation.model';
import { DeviationListComponent } from './deviation-list.component';
import { DeviationFormComponent } from './deviation-form.component';

@Component({
  selector: 'app-deviations-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DeviationListComponent, DeviationFormComponent],
  templateUrl: './deviations-page.component.html',
})
export class DeviationsPageComponent implements OnInit {
  private readonly api = inject(DeviationApiService);

  // ── Screen state ─────────────────────────────────────────────────────────
  readonly deviations = signal<DeviationModel[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isSaving = signal(false);

  // ── Editor panel state ───────────────────────────────────────────────────
  readonly isEditorOpen = signal(false);
  readonly editorMode = signal<'create' | 'edit'>('create');
  readonly editingDeviation = signal<DeviationModel | null>(null);

  // ── Delete confirmation state ─────────────────────────────────────────────
  readonly pendingDeleteId = signal<string | null>(null);

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly isEmpty = computed(
    () => !this.isLoading() && this.deviations().length === 0,
  );

  readonly editorTitle = computed(() =>
    this.editorMode() === 'edit' ? 'Edit deviation' : 'New deviation',
  );

  ngOnInit(): void {
    this.loadDeviations();
  }

  loadDeviations(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.api.getAll().subscribe({
      next: (data) => {
        this.deviations.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load deviations. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  openCreateEditor(): void {
    this.editingDeviation.set(null);
    this.editorMode.set('create');
    this.isEditorOpen.set(true);
  }

  openEditEditor(deviation: DeviationModel): void {
    this.editingDeviation.set(deviation);
    this.editorMode.set('edit');
    this.isEditorOpen.set(true);
  }

  closeEditor(): void {
    this.isEditorOpen.set(false);
    this.editingDeviation.set(null);
  }

  onFormSubmitted(payload: CreateDeviationPayload): void {
    const editing = this.editingDeviation();
    this.isSaving.set(true);
    this.errorMessage.set(null);

    if (this.editorMode() === 'edit' && editing) {
      const update: UpdateDeviationPayload = { ...payload };
      this.api.update(editing.id, update).subscribe({
        next: (updated) => {
          this.deviations.update((list) =>
            list.map((d) => (d.id === updated.id ? updated : d)),
          );
          this.isSaving.set(false);
          this.closeEditor();
        },
        error: () => {
          this.errorMessage.set('Failed to save changes. Please try again.');
          this.isSaving.set(false);
        },
      });
    } else {
      this.api.create(payload).subscribe({
        next: (created) => {
          this.deviations.update((list) => [created, ...list]);
          this.isSaving.set(false);
          this.closeEditor();
        },
        error: () => {
          this.errorMessage.set('Failed to create deviation. Please try again.');
          this.isSaving.set(false);
        },
      });
    }
  }

  requestDelete(id: string): void {
    this.pendingDeleteId.set(id);
  }

  confirmDelete(): void {
    const id = this.pendingDeleteId();
    if (!id) return;

    this.pendingDeleteId.set(null);
    this.errorMessage.set(null);

    this.api.delete(id).subscribe({
      next: () => {
        this.deviations.update((list) => list.filter((d) => d.id !== id));
      },
      error: () => {
        this.errorMessage.set('Failed to delete deviation. Please try again.');
      },
    });
  }

  cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }
}
