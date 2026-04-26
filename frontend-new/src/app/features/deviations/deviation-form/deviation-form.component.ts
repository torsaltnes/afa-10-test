import { Component, effect, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DeviationStore } from '../data/deviation.store';
import { DeviationForm } from '../../../core/models/deviation-form.model';

@Component({
  selector: 'app-deviation-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './deviation-form.component.html',
  styleUrl: './deviation-form.component.css'
})
export class DeviationFormComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #fb = inject(FormBuilder);
  readonly store = inject(DeviationStore);

  editId: string | null = null;
  get isEditMode(): boolean { return this.editId !== null; }

  form = this.buildForm();

  readonly severities = ['Low', 'Medium', 'High', 'Critical'] as const;
  readonly statuses = ['Open', 'InProgress', 'Resolved', 'Closed'] as const;

  constructor() {
    // Watch the selectedDeviation signal and patch form when it arrives
    effect(() => {
      const dev = this.store.selectedDeviation();
      if (dev && this.editId && dev.id === this.editId) {
        this.form.patchValue({
          title: dev.title,
          description: dev.description,
          severity: dev.severity,
          status: dev.status,
          reportedBy: dev.reportedBy,
          occurredAt: dev.occurredAt.slice(0, 10)
        });
      }
    });
  }

  ngOnInit(): void {
    this.editId = this.#route.snapshot.paramMap.get('id');
    if (this.editId) {
      this.loadForEdit(this.editId);
    }
  }

  buildForm() {
    return this.#fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(2000)]],
      severity: ['Low', [Validators.required]],
      status: ['Open', [Validators.required]],
      reportedBy: ['', [Validators.required, Validators.maxLength(100)]],
      occurredAt: ['', [Validators.required]]
    });
  }

  loadForEdit(id: string): void {
    this.store.loadById(id);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.value as DeviationForm;

    if (this.isEditMode) {
      const result = await this.store.update(this.editId!, payload);
      if (result) {
        await this.#router.navigate(['/deviations']);
      }
    } else {
      const result = await this.store.create(payload);
      if (result) {
        await this.#router.navigate(['/deviations']);
      }
    }
  }

  cancel(): void {
    this.#router.navigate(['/deviations']);
  }
}
