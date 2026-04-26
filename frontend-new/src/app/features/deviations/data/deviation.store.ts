import { computed, inject, Injectable, signal } from '@angular/core';
import { DeviationApiService } from '../../../core/services/deviation-api.service';
import { Deviation } from '../../../core/models/deviation.model';
import { DeviationForm } from '../../../core/models/deviation-form.model';

@Injectable({ providedIn: 'root' })
export class DeviationStore {
  readonly #api = inject(DeviationApiService);

  // State signals
  readonly deviations = signal<Deviation[]>([]);
  readonly selectedDeviation = signal<Deviation | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  // Computed
  readonly hasItems = computed(() => this.deviations().length > 0);
  readonly isEmpty = computed(() => !this.loading() && this.deviations().length === 0);

  loadAll(): void {
    this.loading.set(true);
    this.error.set(null);
    this.#api.getAll().subscribe({
      next: (items) => {
        this.deviations.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load deviations');
        this.loading.set(false);
      }
    });
  }

  loadById(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.#api.getById(id).subscribe({
      next: (item) => {
        this.selectedDeviation.set(item);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load deviation');
        this.loading.set(false);
      }
    });
  }

  create(payload: DeviationForm): Promise<Deviation | null> {
    this.saving.set(true);
    this.error.set(null);
    return new Promise((resolve) => {
      this.#api.create(payload).subscribe({
        next: (created) => {
          this.deviations.update(list => [...list, created]);
          this.saving.set(false);
          resolve(created);
        },
        error: (err) => {
          this.error.set(err?.message ?? 'Failed to create deviation');
          this.saving.set(false);
          resolve(null);
        }
      });
    });
  }

  update(id: string, payload: DeviationForm): Promise<Deviation | null> {
    this.saving.set(true);
    this.error.set(null);
    return new Promise((resolve) => {
      this.#api.update(id, payload).subscribe({
        next: (updated) => {
          this.deviations.update(list => list.map(d => d.id === id ? updated : d));
          this.selectedDeviation.set(updated);
          this.saving.set(false);
          resolve(updated);
        },
        error: (err) => {
          this.error.set(err?.message ?? 'Failed to update deviation');
          this.saving.set(false);
          resolve(null);
        }
      });
    });
  }

  remove(id: string): Promise<boolean> {
    this.saving.set(true);
    this.error.set(null);
    return new Promise((resolve) => {
      this.#api.delete(id).subscribe({
        next: () => {
          this.deviations.update(list => list.filter(d => d.id !== id));
          this.saving.set(false);
          resolve(true);
        },
        error: (err) => {
          this.error.set(err?.message ?? 'Failed to delete deviation');
          this.saving.set(false);
          resolve(false);
        }
      });
    });
  }

  clearError(): void {
    this.error.set(null);
  }
}
