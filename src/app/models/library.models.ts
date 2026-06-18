export type StudyItemType = 'question' | 'section' | 'note';
export type ItemStatusFilter = 'all' | 'pending' | 'learned' | 'starred';
export type ItemTypeFilter = 'all' | StudyItemType;
export type AppView = 'reader' | 'practice' | 'insights';

export interface StudyDocument {
  id: string;
  name: string;
  title: string;
  importedAt: string;
  size: number;
  styleText: string;
  itemCount: number;
}

export interface StudyItem {
  id: string;
  documentId: string;
  sourceName: string;
  sourceTitle: string;
  title: string;
  numberLabel: string;
  type: StudyItemType;
  rawHtml: string;
  text: string;
  normalizedText: string;
  keywords: string[];
  options: string[];
  confidence: number;
  starred: boolean;
  learned: boolean;
  note: string;
  createdAt: string;
}

export interface ParsedDocument {
  document: StudyDocument;
  items: StudyItem[];
}

export interface SearchFilters {
  sourceId: string;
  itemType: ItemTypeFilter;
  status: ItemStatusFilter;
  minScore: number;
}

export interface SearchResult {
  item: StudyItem;
  score: number;
  matches: string[];
}

export interface LibraryStats {
  documents: number;
  items: number;
  questions: number;
  sections: number;
  notes: number;
  starred: number;
  learned: number;
  pending: number;
}

export interface LibrarySnapshot {
  version: 1;
  exportedAt: string;
  documents: StudyDocument[];
  items: StudyItem[];
}
