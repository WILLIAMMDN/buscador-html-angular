import { Component, inject } from '@angular/core';
import { LucideCheckCircle, LucideFileText, LucideStar } from '@lucide/angular';
import { StudyItem } from '../../models/library.models';
import { LibraryStoreService } from '../../services/library-store.service';
import { excerpt } from '../../utils/text.utils';

@Component({
  selector: 'app-result-list',
  imports: [LucideCheckCircle, LucideFileText, LucideStar],
  template: `
    <section class="result-list" aria-label="Resultados">
      <div class="result-count">
        <span>{{ store.results().length }} resultados</span>
        <span>{{ store.status() }}</span>
      </div>

      @for (result of store.results(); track result.item.id) {
        <article class="result-item" [class.active]="store.activeItemId() === result.item.id">
          <button type="button" class="result-main" (click)="store.selectItem(result.item.id)">
            <span class="item-meta">
              <span class="item-kind" [class.question]="result.item.type === 'question'">
                {{ typeLabel(result.item) }}
              </span>
              <span>{{ result.score }} pts</span>
            </span>
            <strong>{{ result.item.title }}</strong>
            <span class="result-source">{{ result.item.sourceTitle }}</span>
            <span class="result-excerpt">{{ short(result.item.text) }}</span>
          </button>

          <div class="result-actions">
            <button type="button" title="Favorito" aria-label="Favorito" [class.active]="result.item.starred" (click)="store.toggleStar(result.item.id)">
              <svg lucideStar size="17"></svg>
            </button>
            <button type="button" title="Aprendido" aria-label="Aprendido" [class.active]="result.item.learned" (click)="store.toggleLearned(result.item.id)">
              <svg lucideCheckCircle size="17"></svg>
            </button>
          </div>
        </article>
      } @empty {
        <div class="empty-panel compact">
          <svg lucideFileText size="24"></svg>
          <strong>Sin resultados</strong>
          <span>Carga HTML o cambia los filtros.</span>
        </div>
      }
    </section>
  `,
})
export class ResultListComponent {
  readonly store = inject(LibraryStoreService);

  short(text: string): string {
    return excerpt(text, 165);
  }

  typeLabel(item: StudyItem): string {
    if (item.type === 'question') {
      return `Pregunta ${item.numberLabel}`;
    }

    return item.type === 'section' ? 'Seccion' : 'Nota';
  }
}
