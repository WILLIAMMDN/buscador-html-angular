import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { SAMPLE_HTML } from '../data/sample-html';
import {
  AppView,
  LibrarySnapshot,
  LibraryStats,
  SearchFilters,
  StudyDocument,
  StudyItem,
} from '../models/library.models';
import { HtmlParserService } from './html-parser.service';
import { SearchService } from './search.service';

const STORAGE_KEY = 'buscador-html-angular:v1';
const DEFAULT_FILTERS: SearchFilters = {
  sourceId: 'all',
  itemType: 'all',
  status: 'all',
  minScore: 0,
};

@Injectable({ providedIn: 'root' })
export class LibraryStoreService {
  private readonly parser = inject(HtmlParserService);
  private readonly searchService = inject(SearchService);

  readonly documents = signal<StudyDocument[]>([]);
  readonly items = signal<StudyItem[]>([]);
  readonly query = signal('');
  readonly filters = signal<SearchFilters>({ ...DEFAULT_FILTERS });
  readonly selectedId = signal<string | null>(null);
  readonly view = signal<AppView>('reader');
  readonly status = signal('Esperando archivos HTML');
  readonly importBusy = signal(false);
  readonly dragActive = signal(false);
  readonly practiceIndex = signal(0);
  readonly revealPractice = signal(false);

  readonly stats = computed<LibraryStats>(() => {
    const items = this.items();

    return {
      documents: this.documents().length,
      items: items.length,
      questions: items.filter((item) => item.type === 'question').length,
      sections: items.filter((item) => item.type === 'section').length,
      notes: items.filter((item) => item.type === 'note').length,
      starred: items.filter((item) => item.starred).length,
      learned: items.filter((item) => item.learned).length,
      pending: items.filter((item) => !item.learned).length,
    };
  });

  readonly results = computed(() => this.searchService.search(this.items(), this.query(), this.filters()));

  readonly activeItem = computed(() => {
    const selectedId = this.selectedId();
    const resultItems = this.results().map((result) => result.item);

    return (
      resultItems.find((item) => item.id === selectedId) ??
      this.items().find((item) => item.id === selectedId) ??
      resultItems[0] ??
      this.items()[0] ??
      null
    );
  });

  readonly activeDocument = computed(() => {
    const item = this.activeItem();

    return item ? (this.documents().find((document) => document.id === item.documentId) ?? null) : null;
  });

  readonly activeItemId = computed(() => this.activeItem()?.id ?? null);

  readonly practiceQueue = computed(() => {
    const pending = this.items().filter((item) => item.type === 'question' && !item.learned);
    const allQuestions = this.items().filter((item) => item.type === 'question');

    return pending.length ? pending : allQuestions;
  });

  readonly currentPracticeItem = computed(() => {
    const queue = this.practiceQueue();

    return queue.length ? queue[this.practiceIndex() % queue.length] : null;
  });

  readonly topKeywords = computed(() => {
    const counts = new Map<string, number>();

    for (const item of this.items()) {
      for (const keyword of item.keywords) {
        counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 18)
      .map(([keyword, count]) => ({ keyword, count }));
  });

  constructor() {
    this.restore();

    effect(() => {
      this.persist({
        version: 1,
        exportedAt: new Date().toISOString(),
        documents: this.documents(),
        items: this.items(),
      });
    });
  }

  async importFiles(fileList: FileList | File[] | null): Promise<void> {
    const files = Array.from(fileList ?? []).filter((file) => /\.(html|htm)$/i.test(file.name) || file.type === 'text/html');

    if (!files.length) {
      this.status.set('No se seleccionaron archivos HTML');
      return;
    }

    this.importBusy.set(true);

    try {
      const parsed = [];

      for (const file of files) {
        parsed.push(this.parser.parseDocument(await file.text(), file.name, file.size));
      }

      const newDocuments = parsed.map((entry) => entry.document);
      const newItems = parsed.flatMap((entry) => entry.items);

      this.documents.update((documents) => [...documents, ...newDocuments]);
      this.items.update((items) => this.dedupeItems([...items, ...newItems]));
      this.selectedId.set(newItems[0]?.id ?? this.activeItem()?.id ?? null);
      this.practiceIndex.set(0);
      this.view.set('reader');
      this.status.set(`${newItems.length} elementos importados desde ${files.length} archivo(s)`);
    } finally {
      this.importBusy.set(false);
    }
  }

  loadSample(): void {
    const parsed = this.parser.parseDocument(SAMPLE_HTML, 'guia-redes-demo.html', SAMPLE_HTML.length);

    this.documents.set([parsed.document]);
    this.items.set(parsed.items);
    this.selectedId.set(parsed.items[0]?.id ?? null);
    this.practiceIndex.set(0);
    this.revealPractice.set(false);
    this.view.set('reader');
    this.status.set('Demo local cargada');
  }

  clearLibrary(): void {
    this.documents.set([]);
    this.items.set([]);
    this.selectedId.set(null);
    this.query.set('');
    this.filters.set({ ...DEFAULT_FILTERS });
    this.practiceIndex.set(0);
    this.revealPractice.set(false);
    this.status.set('Biblioteca limpia');
  }

  selectItem(id: string): void {
    this.selectedId.set(id);
    this.view.set('reader');
  }

  setView(view: AppView): void {
    this.view.set(view);
    this.revealPractice.set(false);
  }

  updateQuery(value: string): void {
    this.query.set(value);
  }

  updateFilters(patch: Partial<SearchFilters>): void {
    this.filters.update((filters) => ({ ...filters, ...patch }));
  }

  toggleStar(id: string): void {
    this.patchItem(id, (item) => ({ ...item, starred: !item.starred }));
  }

  toggleLearned(id: string): void {
    this.patchItem(id, (item) => ({ ...item, learned: !item.learned }));
  }

  setNote(id: string, note: string): void {
    this.patchItem(id, (item) => ({ ...item, note }));
  }

  removeDocument(id: string): void {
    this.documents.update((documents) => documents.filter((document) => document.id !== id));
    this.items.update((items) => items.filter((item) => item.documentId !== id));

    if (this.activeItem()?.documentId === id) {
      this.selectedId.set(this.items()[0]?.id ?? null);
    }

    this.status.set('Documento removido');
  }

  styleTextFor(documentId: string): string {
    return this.documents().find((document) => document.id === documentId)?.styleText ?? '';
  }

  nextPractice(step = 1): void {
    const total = this.practiceQueue().length;

    if (!total) {
      return;
    }

    this.practiceIndex.update((index) => (index + step + total) % total);
    this.revealPractice.set(false);
  }

  markPracticeLearned(): void {
    const item = this.currentPracticeItem();

    if (!item) {
      return;
    }

    this.patchItem(item.id, (current) => ({ ...current, learned: true }));
    this.nextPractice();
  }

  togglePracticeReveal(): void {
    this.revealPractice.update((value) => !value);
  }

  exportLibrary(): void {
    const snapshot: LibrarySnapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      documents: this.documents(),
      items: this.items(),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');

    link.href = url;
    link.download = 'biblioteca-html.json';
    link.click();
    URL.revokeObjectURL(url);
    this.status.set('Biblioteca exportada');
  }

  async importLibrary(fileList: FileList | File[] | null): Promise<void> {
    const file = Array.from(fileList ?? [])[0];

    if (!file) {
      return;
    }

    const snapshot = JSON.parse(await file.text()) as LibrarySnapshot;

    if (snapshot.version !== 1 || !Array.isArray(snapshot.documents) || !Array.isArray(snapshot.items)) {
      this.status.set('El JSON no tiene formato de biblioteca');
      return;
    }

    this.documents.set(snapshot.documents);
    this.items.set(snapshot.items);
    this.selectedId.set(snapshot.items[0]?.id ?? null);
    this.practiceIndex.set(0);
    this.status.set(`Biblioteca importada: ${snapshot.items.length} elementos`);
  }

  private patchItem(id: string, updater: (item: StudyItem) => StudyItem): void {
    this.items.update((items) => items.map((item) => (item.id === id ? updater(item) : item)));
  }

  private dedupeItems(items: StudyItem[]): StudyItem[] {
    const seen = new Set<string>();

    return items.filter((item) => {
      const key = `${item.sourceName}:${item.normalizedText.slice(0, 280)}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  private persist(snapshot: LibrarySnapshot): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Persistence is optional; the app still works without localStorage.
    }
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return;
      }

      const snapshot = JSON.parse(raw) as LibrarySnapshot;

      if (snapshot.version === 1 && Array.isArray(snapshot.documents) && Array.isArray(snapshot.items)) {
        this.documents.set(snapshot.documents);
        this.items.set(snapshot.items);
        this.selectedId.set(snapshot.items[0]?.id ?? null);
        this.status.set(`Biblioteca restaurada: ${snapshot.items.length} elementos`);
      }
    } catch {
      this.status.set('No se pudo restaurar la biblioteca local');
    }
  }
}
