import { Component, inject } from '@angular/core';
import { LucideFilter, LucideSearch, LucideSlidersHorizontal } from '@lucide/angular';
import { ItemStatusFilter, ItemTypeFilter } from '../../models/library.models';
import { LibraryStoreService } from '../../services/library-store.service';

@Component({
  selector: 'app-search-panel',
  imports: [LucideFilter, LucideSearch, LucideSlidersHorizontal],
  template: `
    <section class="search-panel">
      <label class="search-field">
        <svg lucideSearch size="18"></svg>
        <input
          type="search"
          placeholder="Buscar concepto, pregunta, comando o fuente"
          [value]="store.query()"
          (input)="onQuery($event)"
        />
      </label>

      <div class="filter-grid">
        <label>
          <span><svg lucideFilter size="15"></svg> Fuente</span>
          <select [value]="store.filters().sourceId" (change)="onSource($event)">
            <option value="all">Todas</option>
            @for (document of store.documents(); track document.id) {
              <option [value]="document.id">{{ document.title }}</option>
            }
          </select>
        </label>

        <label>
          <span><svg lucideSlidersHorizontal size="15"></svg> Tipo</span>
          <select [value]="store.filters().itemType" (change)="onType($event)">
            <option value="all">Todo</option>
            <option value="question">Preguntas</option>
            <option value="section">Secciones</option>
            <option value="note">Notas</option>
          </select>
        </label>

        <label>
          <span>Estado</span>
          <select [value]="store.filters().status" (change)="onStatus($event)">
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="learned">Aprendidos</option>
            <option value="starred">Favoritos</option>
          </select>
        </label>
      </div>
    </section>
  `,
})
export class SearchPanelComponent {
  readonly store = inject(LibraryStoreService);

  onQuery(event: Event): void {
    this.store.updateQuery((event.target as HTMLInputElement).value);
  }

  onSource(event: Event): void {
    this.store.updateFilters({ sourceId: (event.target as HTMLSelectElement).value });
  }

  onType(event: Event): void {
    this.store.updateFilters({ itemType: (event.target as HTMLSelectElement).value as ItemTypeFilter });
  }

  onStatus(event: Event): void {
    this.store.updateFilters({ status: (event.target as HTMLSelectElement).value as ItemStatusFilter });
  }
}
