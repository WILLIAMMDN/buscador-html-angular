import { Component, inject } from '@angular/core';
import { LucideBookOpenText, LucideCheckCircle, LucideFileText, LucideSearch, LucideStar } from '@lucide/angular';
import { LibraryStoreService } from '../../services/library-store.service';

@Component({
  selector: 'app-stats-panel',
  imports: [LucideBookOpenText, LucideCheckCircle, LucideFileText, LucideSearch, LucideStar],
  template: `
    <section class="stats-panel" aria-label="Metricas de biblioteca">
      <article>
        <svg lucideFileText size="18"></svg>
        <strong>{{ store.stats().documents }}</strong>
        <span>Archivos</span>
      </article>
      <article>
        <svg lucideSearch size="18"></svg>
        <strong>{{ store.stats().questions }}</strong>
        <span>Preguntas</span>
      </article>
      <article>
        <svg lucideBookOpenText size="18"></svg>
        <strong>{{ store.stats().items }}</strong>
        <span>Bloques</span>
      </article>
      <article>
        <svg lucideCheckCircle size="18"></svg>
        <strong>{{ store.stats().learned }}</strong>
        <span>Aprendidos</span>
      </article>
      <article>
        <svg lucideStar size="18"></svg>
        <strong>{{ store.stats().starred }}</strong>
        <span>Favoritos</span>
      </article>
    </section>
  `,
})
export class StatsPanelComponent {
  readonly store = inject(LibraryStoreService);
}
