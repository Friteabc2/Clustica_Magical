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
  // Get the current chapter and page
  const currentChapter = book.chapters[currentChapterIndex];
  const currentPage = currentChapter?.pages[currentPageIndex];

  // Debug log to verify content is loaded
  console.log('Preview Content:', {
    currentChapterIndex,
    currentPageIndex,
    chapterExists: !!currentChapter,
    pagesInChapter: currentChapter?.pages?.length || 0,
    pageExists: !!currentPage,
    pageContent: currentPage?.content?.slice(0, 50) || 'No content'
  });
  
  // Handle navigation
  const canGoPrevious = currentPageIndex > 0 || currentChapterIndex > 0;
  const canGoNext = 
    (currentChapter && currentPageIndex < currentChapter.pages.length - 1) || 
    currentChapterIndex < book.chapters.length - 1;
  
  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      // Go to previous page in the same chapter
      return { chapterIndex: currentChapterIndex, pageIndex: currentPageIndex - 1 };
    } else if (currentChapterIndex > 0) {
      // Go to the last page of the previous chapter
      const prevChapter = book.chapters[currentChapterIndex - 1];
      return { 
        chapterIndex: currentChapterIndex - 1, 
        pageIndex: prevChapter.pages.length - 1 
      };
    }
    return null;
  };
  
  const goToNextPage = () => {
    if (currentChapter && currentPageIndex < currentChapter.pages.length - 1) {
      // Go to next page in the same chapter
      return { chapterIndex: currentChapterIndex, pageIndex: currentPageIndex + 1 };
    } else if (currentChapterIndex < book.chapters.length - 1) {
      // Go to the first page of the next chapter
      return { chapterIndex: currentChapterIndex + 1, pageIndex: 0 };
    }
    return null;
  };
  
  // Determine if we're showing the cover - cover is special page 0 of chapter 0
  // We'll treat it separately from the regular pages
  const showCover = currentChapterIndex === 0 && currentPageIndex === 0;
  
  // Calculate total pages for display
  const getTotalPages = () => {
    // Count all pages in all chapters
    return book.chapters.reduce((total, chapter) => total + chapter.pages.length, 0);
  };
  
  // Calculate current page number across all chapters
  const getCurrentPageNumber = () => {
    // If we're showing the cover, it's page 1
    if (showCover) {
      return 1;
    }
    
    // Otherwise, count pages in previous chapters
    let pageCount = 1; // Start at 1 for the cover
    
    for (let i = 0; i < currentChapterIndex; i++) {
      pageCount += book.chapters[i].pages.length;
    }
    
    // Add the current page index
    pageCount += currentPageIndex;
    
    return pageCount;
  };
  
  if (!currentChapter) {
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
        {showCover ? (
          // Book Cover Preview
          <div className="mb-8 bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-secondary p-8 flex flex-col items-center justify-center text-white text-center min-h-[280px]">
              <h1 className="text-4xl font-bold mb-4">{book.title}</h1>
              <p className="text-lg">par {book.author}</p>
            </div>
          </div>
        ) : (
          // Chapter and Page Preview
          <div className="bg-white shadow-md rounded-lg overflow-hidden p-8">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 font-serif">{currentChapter.title}</h2>
            </div>
            
            <div className="prose max-w-none font-serif" 
                 dangerouslySetInnerHTML={{ __html: currentPage?.content || '' }}>
            </div>
            
            <div className="mt-8 text-center text-gray-500 text-sm">
              Page {getCurrentPageNumber()} sur {getTotalPages() + 1} {/* +1 for the cover */}
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
