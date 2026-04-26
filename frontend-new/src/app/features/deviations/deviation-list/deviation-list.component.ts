import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { DeviationStore } from '../data/deviation.store';
import { DeviationBadgeComponent } from '../../../shared/ui/deviation-badge/deviation-badge.component';
import { Deviation } from '../../../core/models/deviation.model';

@Component({
  selector: 'app-deviation-list',
  standalone: true,
  imports: [RouterLink, SlicePipe, DeviationBadgeComponent],
  templateUrl: './deviation-list.component.html',
  styleUrl: './deviation-list.component.css'
})
export class DeviationListComponent implements OnInit {
  readonly store = inject(DeviationStore);

  ngOnInit(): void {
    this.store.loadAll();
  }

  trackById(_index: number, item: Deviation): string {
    return item.id;
  }

  async deleteDeviation(id: string): Promise<void> {
    if (confirm('Delete this deviation?')) {
      await this.store.remove(id);
    }
  }

  retry(): void {
    this.store.loadAll();
  }
}
