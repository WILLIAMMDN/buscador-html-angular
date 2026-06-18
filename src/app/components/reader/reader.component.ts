import { Component, inject } from '@angular/core';
import { LucideCheckCircle, LucideFileX, LucidePanelTop, LucideStar } from '@lucide/angular';
import { LibraryStoreService } from '../../services/library-store.service';
import { PreviewFrameComponent } from '../preview-frame/preview-frame.component';

@Component({
  selector: 'app-reader',
  imports: [LucideCheckCircle, LucideFileX, LucidePanelTop, LucideStar, PreviewFrameComponent],
  template: `
    @if (store.activeItem(); as item) {
      <section class="reader-view">
        <header class="reader-header">
          <div>
            <span class="eyebrow">{{ item.sourceName }}</span>
            <h2>{{ item.title }}</h2>
            <p>{{ item.sourceTitle }}</p>
          </div>

          <div class="reader-actions">
            <button type="button" class="tool-button" title="Favorito" aria-label="Favorito" [class.active]="item.starred" (click)="store.toggleStar(item.id)">
              <svg lucideStar size="18"></svg>
            </button>
            <button type="button" class="tool-button" title="Marcar aprendido" aria-label="Marcar aprendido" [class.active]="item.learned" (click)="store.toggleLearned(item.id)">
              <svg lucideCheckCircle size="18"></svg>
            </button>
            @if (store.activeDocument(); as document) {
              <button type="button" class="tool-button danger" title="Quitar documento" aria-label="Quitar documento" (click)="store.removeDocument(document.id)">
                <svg lucideFileX size="18"></svg>
              </button>
            }
          </div>
        </header>

        <div class="reader-grid">
          <section class="content-preview">
            <div class="section-title">
              <svg lucidePanelTop size="17"></svg>
              <span>Vista del fragmento</span>
            </div>
            <app-preview-frame [item]="item" [styles]="store.activeDocument()?.styleText ?? ''" [query]="store.query()" />
          </section>

          <aside class="study-notes">
            <div class="section-title">
              <span>Palabras clave</span>
            </div>
            <div class="tag-row">
              @for (keyword of item.keywords; track keyword) {
                <button type="button" (click)="store.updateQuery(keyword)">{{ keyword }}</button>
              }
            </div>

            @if (item.options.length) {
              <div class="section-title">
                <span>Opciones detectadas</span>
              </div>
              <ol class="option-list">
                @for (option of item.options; track option) {
                  <li [class.correct-answer]="isMarkedAnswer(item.markedAnswers, option)">
                    <span>{{ option }}</span>
                    @if (isMarkedAnswer(item.markedAnswers, option)) {
                      <strong>
                        <svg lucideCheckCircle size="15"></svg>
                        Marcada
                      </strong>
                    }
                  </li>
                }
              </ol>
            }

            @if (item.markedAnswers.length) {
              <div class="section-title">
                <span>Respuesta marcada en el HTML</span>
              </div>
              <div class="marked-answer-list">
                @for (answer of item.markedAnswers; track answer) {
                  <span>
                    <svg lucideCheckCircle size="15"></svg>
                    {{ answer }}
                  </span>
                }
              </div>
            }

            <label class="note-box">
              <span>Apuntes propios</span>
              <textarea [value]="item.note" placeholder="Escribe una pista, resumen o duda..." (input)="onNote(item.id, $event)"></textarea>
            </label>
          </aside>
        </div>
      </section>
    } @else {
      <section class="empty-panel">
        <strong>Sin contenido seleccionado</strong>
        <span>Importa uno o varios archivos HTML para empezar.</span>
      </section>
    }
  `,
})
export class ReaderComponent {
  readonly store = inject(LibraryStoreService);

  onNote(id: string, event: Event): void {
    this.store.setNote(id, (event.target as HTMLTextAreaElement).value);
  }

  isMarkedAnswer(markedAnswers: string[], option: string): boolean {
    const normalizedOption = this.normalize(option);

    return markedAnswers.some((answer) => {
      const normalizedAnswer = this.normalize(answer);

      return normalizedAnswer === normalizedOption || normalizedAnswer.includes(normalizedOption);
    });
  }

  private normalize(value: string): string {
    return value
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
