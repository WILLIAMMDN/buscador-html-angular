import { Injectable } from '@angular/core';
import { SearchFilters, SearchResult, StudyItem } from '../models/library.models';
import { normalizeText, tokenize } from '../utils/text.utils';

@Injectable({ providedIn: 'root' })
export class SearchService {
  search(items: StudyItem[], query: string, filters: SearchFilters): SearchResult[] {
    const normalizedQuery = normalizeText(query);
    const tokens = tokenize(query);

    return items
      .filter((item) => this.matchesFilters(item, filters))
      .map((item) => this.scoreItem(item, normalizedQuery, tokens))
      .filter((result) => result.score >= filters.minScore)
      .filter((result) => !tokens.length || result.matches.length > 0)
      .sort((a, b) => b.score - a.score || a.item.numberLabel.localeCompare(b.item.numberLabel));
  }

  private matchesFilters(item: StudyItem, filters: SearchFilters): boolean {
    const matchesSource = filters.sourceId === 'all' || item.documentId === filters.sourceId;
    const matchesType = filters.itemType === 'all' || item.type === filters.itemType;
    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'pending' && !item.learned) ||
      (filters.status === 'learned' && item.learned) ||
      (filters.status === 'starred' && item.starred);

    return matchesSource && matchesType && matchesStatus;
  }

  private scoreItem(item: StudyItem, normalizedQuery: string, tokens: string[]): SearchResult {
    if (!tokens.length) {
      return {
        item,
        score: item.confidence,
        matches: [],
      };
    }

    const title = normalizeText(item.title);
    const source = normalizeText(`${item.sourceName} ${item.sourceTitle}`);
    const keywords = item.keywords.join(' ');
    const haystack = `${title} ${source} ${keywords} ${item.normalizedText}`;
    const matches: string[] = [];
    let score = 0;

    if (normalizedQuery && item.normalizedText.includes(normalizedQuery)) {
      score += 32;
      matches.push('frase');
    }

    for (const token of tokens) {
      if (!haystack.includes(token)) {
        continue;
      }

      matches.push(token);
      score += 8;

      if (title.includes(token)) {
        score += 12;
      }

      if (keywords.includes(token)) {
        score += 10;
      }

      if (source.includes(token)) {
        score += 5;
      }
    }

    if (tokens.every((token) => haystack.includes(token))) {
      score += 20;
    }

    if (item.starred) {
      score += 3;
    }

    return {
      item,
      score: Math.min(score + Math.round(item.confidence / 5), 100),
      matches: [...new Set(matches)],
    };
  }
}
