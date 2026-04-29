import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { AttachmentDto } from '../../../core/models/deviation.model';

@Component({
  selector: 'app-attachments-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <!-- Upload area -->
      <div
        class="flex flex-col items-center justify-center gap-3 rounded-xl border-2
               border-dashed border-border p-6 text-center transition-colors duration-150
               hover:border-primary/60"
      >
        <div
          class="flex size-10 items-center justify-center rounded-full bg-surface-raised
                 text-text-secondary"
          aria-hidden="true"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
               stroke="currentColor" stroke-width="1.5">
            <path d="M4 14s0 3 6 3 6-3 6-3"/>
            <path d="M10 3v10M7 6l3-3 3 3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <p class="text-body font-medium text-text-primary">Upload file</p>
          <p class="mt-0.5 text-caption text-text-secondary">
            PDF, Word, Excel, images up to 20 MB
          </p>
        </div>
        <button
          class="rounded-lg border border-border bg-surface-raised px-4 py-2
                 text-body font-medium text-text-primary transition-colors duration-150
                 hover:bg-surface-overlay
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                 disabled:cursor-not-allowed disabled:opacity-50"
          [disabled]="uploading()"
          (click)="triggerFileInput()"
          type="button"
        >
          @if (uploading()) {
            Uploading…
          } @else {
            Choose File
          }
        </button>
        <input
          #fileInput
          type="file"
          class="sr-only"
          (change)="onFileSelected($event)"
          aria-label="Select file to upload"
        />
      </div>

      <!-- File list -->
      @if (attachments().length === 0) {
        <p class="py-4 text-center text-body text-text-secondary">
          No attachments yet.
        </p>
      } @else {
        <ul class="flex flex-col gap-2" aria-label="Attachments">
          @for (att of attachments(); track att.id) {
            <li
              class="flex items-center gap-3 rounded-lg border border-border
                     bg-surface-raised p-3 transition-colors duration-150
                     hover:bg-surface-overlay"
            >
              <!-- File icon -->
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-lg
                       bg-primary/10 text-primary"
                aria-hidden="true"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                     stroke="currentColor" stroke-width="1.2">
                  <path d="M2 1h7l3 3v9H2V1z"/>
                  <path d="M9 1v3h3"/>
                </svg>
              </span>

              <!-- Name & size -->
              <div class="min-w-0 flex-1">
                <p class="truncate text-body font-medium text-text-primary">
                  {{ att.fileName }}
                </p>
                <p class="text-caption text-text-secondary">
                  {{ formatSize(att.fileSize) }} &middot; {{ formatDate(att.uploadedAt) }}
                </p>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2">
                <a
                  [href]="att.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="rounded-md p-1.5 text-text-secondary transition-colors duration-150
                         hover:bg-surface-overlay hover:text-text-primary
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Download {{ att.fileName }}"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                       stroke="currentColor" stroke-width="1.4">
                    <path d="M7 2v7M4 6l3 3 3-3" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 11h10" stroke-linecap="round"/>
                  </svg>
                </a>
                <button
                  class="rounded-md p-1.5 text-text-secondary transition-colors duration-150
                         hover:bg-danger/10 hover:text-danger
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger
                         disabled:cursor-not-allowed disabled:opacity-50"
                  [disabled]="deletingId() === att.id"
                  (click)="deleteRequest.emit(att.id)"
                  type="button"
                  aria-label="Delete {{ att.fileName }}"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                       stroke="currentColor" stroke-width="1.4">
                    <path d="M2 4h10M5 4V2h4v2M5 6v5M9 6v5M3 4l1 8h6l1-8"
                          stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class AttachmentsPanelComponent {
  readonly attachments = input.required<AttachmentDto[]>();
  readonly uploading = input(false);
  readonly deletingId = input<string | null>(null);

  readonly fileSelected = output<File>();
  readonly deleteRequest = output<string>();

  @ViewChild('fileInput') private readonly fileInputRef!: ElementRef<HTMLInputElement>;

  protected triggerFileInput(): void {
    this.fileInputRef.nativeElement.click();
  }

  protected onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.fileSelected.emit(file);
      // Reset so same file can be re-uploaded
      (event.target as HTMLInputElement).value = '';
    }
  }

  protected formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
  }
}
