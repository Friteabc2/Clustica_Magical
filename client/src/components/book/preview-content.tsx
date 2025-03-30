import { BookContent } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PreviewContentProps {
  book: BookContent;
  currentChapterIndex: number;
  currentPageIndex: number;
  onNavigate?: (chapterIndex: number, pageIndex: number) => void;
}

export default function PreviewContent({ 
  book, 
  currentChapterIndex,
  currentPageIndex,
  onNavigate
}: PreviewContentProps) {
  // On détermine si on est en train de visualiser la page de couverture
  const isCoverPage = currentChapterIndex === -1;
  
  // Obtention du chapitre et de la page courante
  const currentChapter = isCoverPage ? null : book.chapters[currentChapterIndex];
  const currentPage = isCoverPage 
    ? book.coverPage 
    : currentChapter?.pages[currentPageIndex];

  // Journalisation pour le débogage
  console.log('Preview Content:', {
    isCoverPage,
    currentChapterIndex,
    currentPageIndex,
    chapterExists: !!currentChapter,
    pagesInChapter: currentChapter?.pages?.length || 0,
    pageExists: !!currentPage,
    pageContent: currentPage?.content?.slice(0, 50) || 'No content'
  });
  
  // Gestion de la navigation
  // Pour la page de couverture, on peut seulement aller à la page suivante (chapitre 0, page 0)
  const canGoPrevious = !isCoverPage && (currentPageIndex > 0 || currentChapterIndex > 0);
  const canGoNext = isCoverPage 
    ? (book.chapters.length > 0) 
    : ((currentChapter && currentPageIndex < currentChapter.pages.length - 1) || 
       currentChapterIndex < book.chapters.length - 1);
  
  const goToPreviousPage = () => {
    if (isCoverPage) {
      // Pas de page précédente pour la couverture
      return null;
    }
    
    if (currentPageIndex > 0) {
      // Aller à la page précédente dans le même chapitre
      return { chapterIndex: currentChapterIndex, pageIndex: currentPageIndex - 1 };
    } else if (currentChapterIndex > 0) {
      // Aller à la dernière page du chapitre précédent
      const prevChapter = book.chapters[currentChapterIndex - 1];
      return { 
        chapterIndex: currentChapterIndex - 1, 
        pageIndex: prevChapter.pages.length - 1 
      };
    } else if (book.coverPage) {
      // Si on est à la première page du premier chapitre et qu'il y a une couverture, aller à la couverture
      return { chapterIndex: -1, pageIndex: 0 };
    }
    
    return null;
  };
  
  const goToNextPage = () => {
    if (isCoverPage) {
      // De la couverture, on va à la première page du premier chapitre
      if (book.chapters.length > 0) {
        return { chapterIndex: 0, pageIndex: 0 };
      }
      return null;
    }
    
    if (currentChapter && currentPageIndex < currentChapter.pages.length - 1) {
      // Aller à la page suivante dans le même chapitre
      return { chapterIndex: currentChapterIndex, pageIndex: currentPageIndex + 1 };
    } else if (currentChapterIndex < book.chapters.length - 1) {
      // Aller à la première page du chapitre suivant
      return { chapterIndex: currentChapterIndex + 1, pageIndex: 0 };
    }
    
    return null;
  };
  
  // Calcul du nombre total de pages pour l'affichage
  const getTotalPages = () => {
    // Compter toutes les pages dans tous les chapitres
    const chapterPages = book.chapters.reduce((total, chapter) => total + chapter.pages.length, 0);
    // Ajouter 1 si la page de couverture existe
    return chapterPages + (book.coverPage ? 1 : 0);
  };
  
  // Calcul du numéro de page actuel à travers tous les chapitres
  const getCurrentPageNumber = () => {
    // Si nous montrons la couverture, c'est la page 1
    if (isCoverPage) {
      return 1;
    }
    
    // Sinon, compter les pages dans les chapitres précédents
    let pageCount = book.coverPage ? 1 : 0; // Commencer à 1 si une couverture existe
    
    for (let i = 0; i < currentChapterIndex; i++) {
      pageCount += book.chapters[i].pages.length;
    }
    
    // Ajouter l'index de page courant
    pageCount += currentPageIndex + 1; // +1 car les indices commencent à 0
    
    return pageCount;
  };
  
  // Si nous n'avons ni chapitre ni couverture, ou si nous essayons d'accéder à un chapitre qui n'existe pas
  if (!isCoverPage && !currentChapter) {
    return (
      <div className="flex-1 overflow-auto p-6 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun contenu à afficher</h3>
          <p className="text-gray-500">Créez un chapitre pour prévisualiser votre livre</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-gray-100">
      <div className="max-w-3xl mx-auto">
        {isCoverPage ? (
          // Aperçu de la page de couverture avec un design spécial
          <div className="mb-8 bg-gradient-to-b from-white to-gray-50 shadow-lg rounded-lg overflow-hidden border border-gray-200">
            <div className="relative">
              {/* Badge "Page de couverture" */}
              <div className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                COUVERTURE
              </div>
              
              {/* Haut de la couverture avec dégradé */}
              <div className="bg-gradient-to-br from-primary/90 to-secondary/90 p-12 flex flex-col items-center justify-center text-white text-center min-h-[320px]">
                <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm border border-white/20 shadow-lg transform -rotate-1">
                  <h1 className="text-5xl font-bold mb-6 font-serif">{book.title}</h1>
                  <p className="text-xl italic">par {book.author}</p>
                </div>
              </div>
            </div>
            
            {/* Contenu de la page de couverture */}
            {book.coverPage && book.coverPage.content && (
              <div className="p-8 prose max-w-none bg-white border-t border-gray-200" 
                   dangerouslySetInnerHTML={{ __html: book.coverPage.content }}>
              </div>
            )}
            
            {/* Information sur la page spéciale */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 text-center text-gray-500 text-sm">
              Cette page spéciale apparaîtra toujours en premier dans votre livre
            </div>
          </div>
        ) : (
          // Aperçu du chapitre et de la page
          <div className="bg-white shadow-md rounded-lg overflow-hidden p-8">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 font-serif">{currentChapter?.title}</h2>
            </div>
            
            <div className="prose max-w-none font-serif" 
                 dangerouslySetInnerHTML={{ __html: currentPage?.content || '' }}>
            </div>
            
            <div className="mt-8 text-center text-gray-500 text-sm">
              Page {getCurrentPageNumber()} sur {getTotalPages()}
            </div>
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={() => {
              const prev = goToPreviousPage();
              if (prev && onNavigate) {
                onNavigate(prev.chapterIndex, prev.pageIndex);
              }
            }}
            disabled={!canGoPrevious}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Page précédente
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              const next = goToNextPage();
              if (next && onNavigate) {
                onNavigate(next.chapterIndex, next.pageIndex);
              }
            }}
            disabled={!canGoNext}
          >
            Page suivante
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
