// We import from shared schema for consistency, but we define some utility types here
import { BookContent, Chapter, PageContent } from '@shared/schema';

// Navigation types
export interface BookNavigationState {
  chapterIndex: number;
  pageIndex: number;
}

export interface EditorState {
  modified: boolean;
  currentChapterIndex: number;
  currentPageIndex: number;
  selectedText: string | null;
}

export interface ExportOptions {
  language: string;
  includeCover: boolean;
  customCoverImage?: string;
}

// Export format types
export enum ExportFormat {
  EPUB = 'epub',
  PDF = 'pdf',
  HTML = 'html',
}

// Utility functions
export function getEmptyBook(title: string = 'Nouveau Livre', author: string = 'Votre Nom'): BookContent {
  return {
    title,
    author,
    chapters: []
  };
}

export function getEmptyChapter(title: string = 'Nouveau Chapitre'): Chapter {
  return {
    id: crypto.randomUUID(),
    title,
    pages: [getEmptyPage()]
  };
}

export function getEmptyPage(pageNumber: number = 1): PageContent {
  return {
    content: '<p>Écrivez votre contenu ici...</p>',
    pageNumber
  };
}
