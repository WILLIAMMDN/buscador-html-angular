import { Component, inject } from '@angular/core';
import { LucideDatabase, LucideDownload, LucideFolderOpen, LucideTrash2, LucideUpload } from '@lucide/angular';
import { LibraryStoreService } from '../../services/library-store.service';

@Component({
  selector: 'app-import-panel',
  imports: [LucideDatabase, LucideDownload, LucideFolderOpen, LucideTrash2, LucideUpload],
  template: `
    <section
      class="import-panel"
      [class.is-dragging]="store.dragActive()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave()"
      (drop)="onDrop($event)"
    >
      <input #htmlFiles type="file" accept=".html,.htm,text/html" multiple hidden (change)="onHtmlFiles($event)" />
      <input #jsonFile type="file" accept=".json,application/json" hidden (change)="onJsonFile($event)" />

      <button type="button" class="primary-button" (click)="htmlFiles.click()" [disabled]="store.importBusy()">
        <svg lucideUpload size="18"></svg>
        Importar HTML
      </button>

      <button type="button" class="tool-button" title="Cargar demo" aria-label="Cargar demo" (click)="store.loadSample()">
        <svg lucideDatabase size="18"></svg>
      </button>

      <button type="button" class="tool-button" title="Importar biblioteca JSON" aria-label="Importar biblioteca JSON" (click)="jsonFile.click()">
        <svg lucideFolderOpen size="18"></svg>
      </button>

      <button type="button" class="tool-button" title="Exportar biblioteca" aria-label="Exportar biblioteca" [disabled]="!store.items().length" (click)="store.exportLibrary()">
        <svg lucideDownload size="18"></svg>
      </button>

      <button type="button" class="tool-button danger" title="Limpiar biblioteca" aria-label="Limpiar biblioteca" [disabled]="!store.items().length" (click)="store.clearLibrary()">
        <svg lucideTrash2 size="18"></svg>
      </button>
    </section>
  `,
})
export class ImportPanelComponent {
  readonly store = inject(LibraryStoreService);

  async onHtmlFiles(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    await this.store.importFiles(input.files);
    input.value = '';
  }

  async onJsonFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    await this.store.importLibrary(input.files);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.store.dragActive.set(true);
  }

  onDragLeave(): void {
    this.store.dragActive.set(false);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.store.dragActive.set(false);
    await this.store.importFiles(event.dataTransfer?.files ?? null);
  }
}
