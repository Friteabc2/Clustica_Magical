// We import from shared schema for consistency, but we define some utility types here
import { BookContent, Chapter, PageContent } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';

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
    coverPage: {
      content: `<p>Bienvenue dans votre nouveau livre!</p>
<p>Cette page de couverture est une page spéciale qui sera toujours la première de votre livre. Vous pouvez modifier son contenu ici, mais elle ne peut pas être supprimée.</p>
<p>Utilisez la barre d'outils ci-dessus pour ajouter du texte mis en forme, des images, et d'autres éléments à votre page de couverture.</p>`,
      pageNumber: 0,
      isCover: true
    },
    chapters: []
  };
}

export function getEmptyChapter(title: string = 'Nouveau Chapitre'): Chapter {
  return {
    id: uuidv4(),
    title,
    pages: [getEmptyPage()]
  };
}

export function getEmptyPage(pageNumber: number = 1, isCover: boolean = false): PageContent {
  return {
    content: isCover 
      ? '<p>Couverture de votre livre</p>' 
      : '<p>Écrivez votre contenu ici...</p>',
    pageNumber,
    isCover
  };
}

export function getCoverPage(): PageContent {
  return getEmptyPage(0, true);
}
