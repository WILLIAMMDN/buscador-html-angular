import { Component, inject } from '@angular/core';
import { LucideCheckCircle, LucideChevronLeft, LucideChevronRight, LucideEye, LucideEyeOff } from '@lucide/angular';
import { LibraryStoreService } from '../../services/library-store.service';
import { PreviewFrameComponent } from '../preview-frame/preview-frame.component';

@Component({
  selector: 'app-practice',
  imports: [LucideCheckCircle, LucideChevronLeft, LucideChevronRight, LucideEye, LucideEyeOff, PreviewFrameComponent],
  template: `
    @if (store.currentPracticeItem(); as item) {
      <section class="practice-view">
        <div class="practice-counter">
          <span>{{ store.practiceIndex() + 1 }} / {{ store.practiceQueue().length }}</span>
          <span>{{ item.sourceTitle }}</span>
        </div>

        <article class="practice-card">
          <span class="item-kind question">Pregunta {{ item.numberLabel }}</span>
          <h2>{{ item.text }}</h2>

          @if (item.keywords.length) {
            <div class="tag-row compact-tags">
              @for (keyword of item.keywords.slice(0, 6); track keyword) {
                <span>{{ keyword }}</span>
              }
            </div>
          }

          @if (store.revealPractice()) {
            <div class="reveal-panel">
              <app-preview-frame [item]="item" [styles]="store.styleTextFor(item.documentId)" [query]="store.query()" />
            </div>
          }
        </article>

        <footer class="practice-actions">
          <button type="button" class="secondary-button" (click)="store.nextPractice(-1)">
            <svg lucideChevronLeft size="18"></svg>
            Anterior
          </button>
          <button type="button" class="primary-button" (click)="store.togglePracticeReveal()">
            @if (store.revealPractice()) {
              <svg lucideEyeOff size="18"></svg>
              Ocultar
            } @else {
              <svg lucideEye size="18"></svg>
              Ver fragmento
            }
          </button>
          <button type="button" class="secondary-button" (click)="store.markPracticeLearned()">
            <svg lucideCheckCircle size="18"></svg>
            Aprendido
          </button>
          <button type="button" class="secondary-button" (click)="store.nextPractice()">
            Siguiente
            <svg lucideChevronRight size="18"></svg>
          </button>
        </footer>
      </section>
    } @else {
      <section class="empty-panel">
        <strong>No hay preguntas para practicar</strong>
        <span>Importa un HTML con preguntas numeradas o carga la demo.</span>
      </section>
    }
  `,
})
export class PracticeComponent {
  readonly store = inject(LibraryStoreService);
}
