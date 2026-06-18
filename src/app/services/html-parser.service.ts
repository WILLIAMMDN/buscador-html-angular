import { Injectable } from '@angular/core';
import { ParsedDocument, StudyItem, StudyItemType } from '../models/library.models';
import { cleanText, escapeRegExp, extractKeywords, makeId, normalizeText } from '../utils/text.utils';

const BLOCK_SELECTOR = 'h1,h2,h3,h4,h5,h6,p,li,dt,dd,blockquote,pre,tr,section,article,div';
const UNSAFE_SELECTOR = 'script,noscript,iframe,object,embed,form,input,button,textarea,select';

@Injectable({ providedIn: 'root' })
export class HtmlParserService {
  parseDocument(html: string, fileName: string, size = html.length): ParsedDocument {
    const source = new DOMParser().parseFromString(html, 'text/html');
    this.cleanDocument(source);

    const documentId = makeId('doc');
    const title = cleanText(
      source.querySelector('title, h1, h2')?.textContent ?? fileName.replace(/\.(html|htm)$/i, ''),
    );
    const styleText = this.extractStyleText(source);
    const starts = this.findStarts(source);
    const createdAt = new Date().toISOString();
    const items = starts.length
      ? this.groupFromStarts(source, starts, documentId, fileName, title, createdAt)
      : this.fallbackBlocks(source, documentId, fileName, title, createdAt);

    return {
      document: {
        id: documentId,
        name: fileName,
        title: title || fileName,
        importedAt: createdAt,
        size,
        styleText,
        itemCount: items.length,
      },
      items,
    };
  }

  buildPreviewDocument(item: StudyItem | null, styleText: string, query: string): string {
    const body = item
      ? this.highlightHtml(this.applyDetectedAnswerMarkers(item.rawHtml, item.markedAnswers ?? []), query)
      : '<p>Selecciona un elemento.</p>';

    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 20px;
    color: #1d2522;
    background: #fff;
    font: 15px/1.62 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  img { max-width: 100%; height: auto; border-radius: 6px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #d8e0dc; padding: 8px; vertical-align: top; }
  pre { white-space: pre-wrap; overflow-wrap: anywhere; }
  mark { background: #ffe66f; color: #111; border-radius: 3px; padding: 0 2px; }
  .study-detected-answer {
    display: block !important;
    margin: 6px 0 !important;
    background: #dcf7e7 !important;
    border: 1px solid #55b37e !important;
    border-radius: 6px !important;
    box-shadow: inset 3px 0 0 #15803d !important;
    padding: 4px 8px !important;
  }
  li.study-detected-answer { list-style-position: inside !important; }
  article { max-width: 980px; margin: 0 auto; }
${styleText}
</style>
</head>
<body>
  <article>${body}</article>
</body>
</html>`;
  }

  private cleanDocument(doc: Document): void {
    doc.querySelectorAll(UNSAFE_SELECTOR).forEach((node) => node.remove());

    doc.querySelectorAll('*').forEach((element) => {
      for (const attribute of Array.from(element.attributes)) {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();

        if (name.startsWith('on') || value.startsWith('javascript:')) {
          element.removeAttribute(attribute.name);
        }
      }
    });
  }

  private extractStyleText(doc: Document): string {
    return Array.from(doc.querySelectorAll('style'))
      .map((style) => style.textContent ?? '')
      .join('\n')
      .replace(/@import[^;]+;/gi, '')
      .replace(/expression\s*\([^)]*\)/gi, '')
      .replace(/javascript:/gi, '');
  }

  private findStarts(doc: Document): Element[] {
    const blocks = Array.from(doc.body?.querySelectorAll(BLOCK_SELECTOR) ?? []);
    const starts = blocks.filter((element) => this.isStartElement(element));

    return starts.filter((element) => !starts.some((other) => other !== element && other.contains(element)));
  }

  private groupFromStarts(
    doc: Document,
    starts: Element[],
    documentId: string,
    sourceName: string,
    sourceTitle: string,
    createdAt: string,
  ): StudyItem[] {
    const items: StudyItem[] = [];

    starts.forEach((start, index) => {
      const nextStart = starts[index + 1] ?? null;
      const fragment: Element[] = [];
      let current: Element | null = start;
      let guard = 0;

      while (current && guard < 80) {
        if (current !== start && starts.includes(current)) {
          break;
        }

        if (nextStart && (current === nextStart || current.contains(nextStart))) {
          break;
        }

        fragment.push(current);
        current = current.nextElementSibling;
        guard += 1;
      }

      const item = this.createItem(fragment, documentId, sourceName, sourceTitle, createdAt, index + 1);

      if (item) {
        items.push(item);
      }
    });

    return this.dedupe(items.length ? items : this.fallbackBlocks(doc, documentId, sourceName, sourceTitle, createdAt));
  }

  private fallbackBlocks(
    doc: Document,
    documentId: string,
    sourceName: string,
    sourceTitle: string,
    createdAt: string,
  ): StudyItem[] {
    const blocks = Array.from(doc.body?.querySelectorAll(BLOCK_SELECTOR) ?? [])
      .filter((element) => !element.querySelector(BLOCK_SELECTOR))
      .map((element, index) => this.createItem([element], documentId, sourceName, sourceTitle, createdAt, index + 1))
      .filter((item): item is StudyItem => !!item);

    return this.dedupe(blocks);
  }

  private createItem(
    elements: Element[],
    documentId: string,
    sourceName: string,
    sourceTitle: string,
    createdAt: string,
    position: number,
  ): StudyItem | null {
    const text = cleanText(elements.map((element) => element.textContent ?? '').join(' '));

    if (text.length < 24) {
      return null;
    }

    const rawHtml = elements.map((element) => element.outerHTML).join('\n');
    const options = this.extractOptions(rawHtml);
    const type = this.detectType(elements[0], text);
    const numberLabel = this.extractNumberLabel(text, position);
    const title = this.buildTitle(text, sourceTitle, numberLabel, type);

    return {
      id: makeId('item'),
      documentId,
      sourceName,
      sourceTitle,
      title,
      numberLabel,
      type,
      rawHtml,
      text,
      normalizedText: normalizeText(text),
      keywords: extractKeywords(`${sourceTitle} ${text}`),
      options,
      markedAnswers: this.extractMarkedAnswers(rawHtml, options),
      confidence: this.score(elements[0], text, type),
      starred: false,
      learned: false,
      note: '',
      createdAt,
    };
  }

  private isStartElement(element: Element): boolean {
    const text = cleanText(element.textContent ?? '');
    const tagName = element.tagName.toLowerCase();

    return (
      /^(pregunta\s*)?\d{1,3}[\.)-]\s+/.test(normalizeText(text)) ||
      (/^h[1-6]$/.test(tagName) && /[?¿]/.test(text)) ||
      (/^(what|which|why|how|when|where|who|que|cual|como|cuando|donde|por que)\b/.test(normalizeText(text)) &&
        text.length < 260)
    );
  }

  private detectType(element: Element, text: string): StudyItemType {
    const tagName = element.tagName.toLowerCase();

    if (this.isStartElement(element) || /[?¿]/.test(text)) {
      return 'question';
    }

    if (/^h[1-6]$/.test(tagName)) {
      return 'section';
    }

    return 'note';
  }

  private extractNumberLabel(text: string, fallback: number): string {
    const match = cleanText(text).match(/^(?:pregunta\s*)?(\d{1,3})[\.)-]\s*/i);

    return match?.[1] ?? String(fallback);
  }

  private buildTitle(text: string, sourceTitle: string, numberLabel: string, type: StudyItemType): string {
    const firstSentence = cleanText(text).split(/(?<=[?.!])\s+/)[0] ?? text;
    const short = firstSentence.length > 96 ? `${firstSentence.slice(0, 96).trim()}...` : firstSentence;

    if (type === 'question') {
      return `Pregunta ${numberLabel}`;
    }

    return short || sourceTitle;
  }

  private extractOptions(rawHtml: string): string[] {
    const fragment = new DOMParser().parseFromString(`<main>${rawHtml}</main>`, 'text/html');
    const listOptions = Array.from(fragment.querySelectorAll('li'))
      .map((element) => cleanText(element.textContent ?? ''))
      .filter(Boolean);

    if (listOptions.length) {
      return listOptions.slice(0, 8);
    }

    return cleanText(fragment.body.textContent ?? '')
      .split(/\s+(?=[A-D][.)]\s+)/)
      .map((option) => option.match(/^[A-D][.)]\s+(.+)/i)?.[1] ?? '')
      .filter(Boolean)
      .slice(0, 8);
  }

  private extractMarkedAnswers(rawHtml: string, options: string[]): string[] {
    const fragment = new DOMParser().parseFromString(`<main>${rawHtml}</main>`, 'text/html');
    const root = fragment.querySelector('main');

    if (!root) {
      return [];
    }

    const markedTexts = Array.from(root.querySelectorAll('*'))
      .filter((element) => this.hasAnswerMarker(element))
      .map((element) => cleanText(element.textContent ?? ''))
      .filter((text) => text.length > 0);
    const labelTexts = cleanText(root.textContent ?? '')
      .split(/(?<=[.!?])\s+|\n+/)
      .map((line) => line.match(/(?:correct\s+answer|answer\s+key|respuesta\s+correcta|opcion\s+correcta|solucion)\s*[:.-]\s*(.+)$/i)?.[1] ?? '')
      .map(cleanText)
      .filter(Boolean);

    const answers = new Set<string>();

    for (const option of options) {
      const normalizedOption = normalizeText(option);
      const isMarked = [...markedTexts, ...labelTexts].some((text) => {
        const normalizedTextValue = normalizeText(text);

        return (
          normalizedTextValue === normalizedOption ||
          normalizedTextValue.includes(normalizedOption) ||
          normalizedOption.includes(normalizedTextValue)
        );
      });

      if (isMarked) {
        answers.add(option);
      }
    }

    if (!answers.size) {
      for (const text of labelTexts) {
        answers.add(text);
      }
    }

    return [...answers].slice(0, 8);
  }

  private hasAnswerMarker(element: Element): boolean {
    const attributes = Array.from(element.attributes)
      .map((attribute) => `${attribute.name} ${attribute.value}`)
      .join(' ');
    const value = normalizeText(attributes);

    if (!value || /\b(incorrect|wrong|false|disabled|distractor)\b/.test(value)) {
      return false;
    }

    if (
      /\b(correct|right|success|selected|checked|solution|solucion|correcta|verdadero|true)\b/.test(value) ||
      /correct-answer|answer-correct|respuesta-correcta|is-correct/.test(value)
    ) {
      return true;
    }

    const style = element.getAttribute('style')?.toLowerCase() ?? '';

    return /#d4edda|#c6efce|#bbf7d0|rgb\(40,\s*167,\s*69\)|rgb\(34,\s*197,\s*94\)|green/.test(style);
  }

  private applyDetectedAnswerMarkers(rawHtml: string, markedAnswers: string[]): string {
    if (!markedAnswers.length) {
      return rawHtml;
    }

    const fragment = new DOMParser().parseFromString(`<main>${rawHtml}</main>`, 'text/html');
    const root = fragment.querySelector('main');

    if (!root) {
      return rawHtml;
    }

    const normalizedAnswers = markedAnswers.map(normalizeText);

    for (const element of Array.from(root.querySelectorAll('li,p,div,td,th,span'))) {
      const text = normalizeText(element.textContent ?? '');

      if (!text) {
        continue;
      }

      const matchesAnswer = normalizedAnswers.some(
        (answer) => text === answer || (text.includes(answer) && text.length <= answer.length + 18),
      );

      if (matchesAnswer) {
        element.classList.add('study-detected-answer');
      }
    }

    return root.innerHTML;
  }

  private score(element: Element, text: string, type: StudyItemType): number {
    let score = type === 'question' ? 68 : type === 'section' ? 54 : 42;

    if (/^(pregunta\s*)?\d{1,3}[\.)-]\s+/.test(normalizeText(text))) {
      score += 14;
    }

    if (/[?¿]/.test(text)) {
      score += 12;
    }

    if (element.querySelector('li') || element.nextElementSibling?.tagName.toLowerCase() === 'ul') {
      score += 6;
    }

    return Math.min(score, 98);
  }

  private dedupe(items: StudyItem[]): StudyItem[] {
    const seen = new Set<string>();

    return items.filter((item) => {
      const key = `${item.documentId}:${item.normalizedText.slice(0, 260)}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  private highlightHtml(html: string, query: string): string {
    const terms = [
      cleanText(query),
      ...normalizeText(query)
        .split(/\s+/)
        .filter((token) => token.length > 2),
    ]
      .filter(Boolean)
      .map(escapeRegExp);

    if (!terms.length) {
      return html;
    }

    const fragment = new DOMParser().parseFromString(`<main>${html}</main>`, 'text/html');
    const root = fragment.querySelector('main');

    if (!root) {
      return html;
    }

    const regex = new RegExp(`(${[...new Set(terms)].join('|')})`, 'gi');
    const walker = fragment.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let current = walker.nextNode();

    while (current) {
      nodes.push(current as Text);
      current = walker.nextNode();
    }

    for (const node of nodes) {
      const text = node.nodeValue ?? '';

      if (!regex.test(text)) {
        regex.lastIndex = 0;
        continue;
      }

      regex.lastIndex = 0;
      const nodesToInsert: Node[] = [];

      for (const part of text.split(regex)) {
        if (!part) {
          continue;
        }

        regex.lastIndex = 0;

        if (regex.test(part)) {
          const mark = fragment.createElement('mark');
          mark.textContent = part;
          nodesToInsert.push(mark);
        } else {
          nodesToInsert.push(fragment.createTextNode(part));
        }
      }

      node.replaceWith(...nodesToInsert);
    }

    return root.innerHTML;
  }
}
