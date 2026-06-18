import { Component, inject } from '@angular/core';
import { LucideBarChart3, LucideDatabase, LucideListChecks } from '@lucide/angular';
import { LibraryStoreService } from '../../services/library-store.service';

@Component({
  selector: 'app-insights',
  imports: [LucideBarChart3, LucideDatabase, LucideListChecks],
  template: `
    <section class="insights-view">
      <div class="insight-grid">
        <article class="insight-panel">
          <div class="section-title">
            <svg lucideBarChart3 size="18"></svg>
            <span>Resumen</span>
          </div>
          <dl class="summary-list">
            <div>
              <dt>Documentos</dt>
              <dd>{{ store.stats().documents }}</dd>
            </div>
            <div>
              <dt>Preguntas</dt>
              <dd>{{ store.stats().questions }}</dd>
            </div>
            <div>
              <dt>Pendientes</dt>
              <dd>{{ store.stats().pending }}</dd>
            </div>
            <div>
              <dt>Aprendidos</dt>
              <dd>{{ store.stats().learned }}</dd>
            </div>
          </dl>
        </article>

        <article class="insight-panel">
          <div class="section-title">
            <svg lucideListChecks size="18"></svg>
            <span>Temas detectados</span>
          </div>
          <div class="keyword-cloud">
            @for (entry of store.topKeywords(); track entry.keyword) {
              <button type="button" [style.--weight]="entry.count" (click)="store.updateQuery(entry.keyword)">
                {{ entry.keyword }}
                <small>{{ entry.count }}</small>
              </button>
            } @empty {
              <span class="muted">Sin palabras clave todavia.</span>
            }
          </div>
        </article>
      </div>

      <article class="insight-panel documents-panel">
        <div class="section-title">
          <svg lucideDatabase size="18"></svg>
          <span>Fuentes importadas</span>
        </div>
        <div class="document-table">
          @for (document of store.documents(); track document.id) {
            <div>
              <strong>{{ document.title }}</strong>
              <span>{{ document.name }}</span>
              <span>{{ document.itemCount }} bloques</span>
              <button type="button" class="text-button" (click)="store.removeDocument(document.id)">Quitar</button>
            </div>
          } @empty {
            <span class="muted">Aun no hay fuentes importadas.</span>
          }
        </div>
      </article>
    </section>
  `,
})
export class InsightsComponent {
  readonly store = inject(LibraryStoreService);
}
