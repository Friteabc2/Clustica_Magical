import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { BookContent, Chapter, PageContent } from '@shared/schema';
import Sidebar from '@/components/book/sidebar';
import EditorContent from '@/components/book/editor-content';
import PreviewContent from '@/components/book/preview-content';
import ExportModal from '@/components/book/export-modal';
import { Button } from '@/components/ui/button';
import { Save, FileOutput, Settings, BookOpen, ArrowLeft } from 'lucide-react';

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<'editor' | 'preview'>('editor');
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  // Initialize default book content
  const defaultBookContent: BookContent = {
    title: 'Nouveau Livre',
    author: 'Votre Nom',
    chapters: [{
      id: uuidv4(),
      title: 'Chapitre 1: Le Début',
      pages: [{
        content: '<p>Commencez à écrire votre histoire ici...</p>',
        pageNumber: 1
      }]
    }]
  };
  
  // Book content state
  const [bookContent, setBookContent] = useState<BookContent>(defaultBookContent);
  
  // Fetch book content if ID is provided
  const { data, isLoading, isError } = useQuery<BookContent>({
    queryKey: ['/api/books', id, 'content'],
    queryFn: async ({ queryKey }) => {
      if (!id) return defaultBookContent;
      const res = await fetch(`/api/books/${id}/content`);
      if (!res.ok) throw new Error('Failed to fetch book content');
      return res.json();
    },
    enabled: !!id,
  });
  
  // Update book content when data is loaded
  useEffect(() => {
    if (data) {
      setBookContent(data);
    }
  }, [data]);
  
  // Create book mutation
  const createBook = useMutation({
    mutationFn: async (book: BookContent) => {
      const res = await apiRequest('POST', '/api/books', {
        title: book.title,
        author: book.author,
        chapters: book.chapters
      });
      return await res.json();
    },
    onSuccess: (newBook) => {
      toast({
        title: 'Livre créé',
        description: 'Votre livre a été créé avec succès.',
      });
      navigate(`/editor/${newBook.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le livre: ' + error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Update book mutation
  const updateBook = useMutation({
    mutationFn: async (params: { id: string; content: BookContent }) => {
      const res = await apiRequest('PUT', `/api/books/${params.id}/content`, params.content);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Enregistré',
        description: 'Votre livre a été enregistré avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/books', id, 'content'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer le livre: ' + error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Handle save
  const handleSave = () => {
    if (id) {
      updateBook.mutate({ id, content: bookContent });
    } else {
      createBook.mutate(bookContent);
    }
  };
  
  // Add new chapter
  const addChapter = () => {
    const newChapters = [...bookContent.chapters];
    newChapters.push({
      id: uuidv4(),
      title: `Chapitre ${newChapters.length + 1}`,
      pages: [{
        content: '<p>Contenu du nouveau chapitre...</p>',
        pageNumber: 1
      }]
    });
    
    setBookContent({
      ...bookContent,
      chapters: newChapters
    });
    
    // Select the new chapter
    setCurrentChapterIndex(newChapters.length - 1);
    setCurrentPageIndex(0);
  };
  
  // Add new page to current chapter
  const addPage = () => {
    if (bookContent.chapters.length === 0) {
      addChapter();
      return;
    }
    
    const updatedChapters = [...bookContent.chapters];
    const currentChapter = {...updatedChapters[currentChapterIndex]};
    
    // Make a copy of current pages and add a new one
    const updatedPages = [...currentChapter.pages];
    updatedPages.push({
      content: '<p>Nouvelle page...</p>',
      pageNumber: updatedPages.length + 1
    });
    
    // Update the chapter with the new pages array
    currentChapter.pages = updatedPages;
    updatedChapters[currentChapterIndex] = currentChapter;
    
    setBookContent({
      ...bookContent,
      chapters: updatedChapters
    });
    
    // Select the new page
    setCurrentPageIndex(updatedPages.length - 1);
  };
  
  // Update chapter content
  const updateChapterTitle = (chapterIndex: number, newTitle: string) => {
    const updatedChapters = [...bookContent.chapters];
    updatedChapters[chapterIndex] = {
      ...updatedChapters[chapterIndex],
      title: newTitle
    };
    
    setBookContent({
      ...bookContent,
      chapters: updatedChapters
    });
  };
  
  // Delete chapter
  const deleteChapter = (chapterIndex: number) => {
    if (bookContent.chapters.length <= 1) {
      toast({
        title: 'Action impossible',
        description: 'Vous devez conserver au moins un chapitre.',
        variant: 'destructive'
      });
      return;
    }
    
    const updatedChapters = bookContent.chapters.filter((_, index) => index !== chapterIndex);
    
    setBookContent({
      ...bookContent,
      chapters: updatedChapters
    });
    
    // Adjust current chapter index if necessary
    if (currentChapterIndex >= updatedChapters.length) {
      setCurrentChapterIndex(updatedChapters.length - 1);
      setCurrentPageIndex(0);
    }
  };
  
  // Update page content
  const updatePageContent = (content: string) => {
    if (bookContent.chapters.length === 0) return;
    
    const updatedChapters = [...bookContent.chapters];
    const currentChapter = {...updatedChapters[currentChapterIndex]};
    
    if (currentPageIndex >= currentChapter.pages.length) {
      setCurrentPageIndex(0);
      return;
    }
    
    currentChapter.pages = [...currentChapter.pages];
    currentChapter.pages[currentPageIndex] = {
      ...currentChapter.pages[currentPageIndex],
      content
    };
    
    updatedChapters[currentChapterIndex] = currentChapter;
    
    setBookContent({
      ...bookContent,
      chapters: updatedChapters
    });
  };
  
  // Get current content
  const getCurrentChapter = (): Chapter | null => {
    if (!bookContent.chapters.length || currentChapterIndex >= bookContent.chapters.length) {
      return null;
    }
    return bookContent.chapters[currentChapterIndex];
  };
  
  const getCurrentPage = (): PageContent | null => {
    const chapter = getCurrentChapter();
    if (!chapter || !chapter.pages.length || currentPageIndex >= chapter.pages.length) {
      return null;
    }
    return chapter.pages[currentPageIndex];
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du livre...</p>
        </div>
      </div>
    );
  }
  
  if (isError && id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Impossible de charger le livre demandé.</p>
          <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste des livres
          </Button>
        </div>
      </div>
    );
  }
  
  const currentChapter = getCurrentChapter();
  const currentPage = getCurrentPage();
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate('/')} className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div className="flex-shrink-0 flex items-center">
                <div className="bg-gradient-to-r from-primary to-secondary rounded-lg w-8 h-8 flex items-center justify-center text-white">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-800">Clustica</span>
                <span className="ml-1 text-sm text-secondary font-medium">Magical</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={handleSave}
                disabled={updateBook.isPending || createBook.isPending}
              >
                <Save className="h-4 w-4 mr-1.5" />
                {updateBook.isPending || createBook.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setIsExportOpen(true)}
              >
                <FileOutput className="h-4 w-4 mr-1.5" />
                Exporter en EPUB
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          book={bookContent}
          setBook={setBookContent}
          currentChapterIndex={currentChapterIndex}
          setCurrentChapterIndex={setCurrentChapterIndex}
          setCurrentPageIndex={setCurrentPageIndex}
          addChapter={addChapter}
          updateChapterTitle={updateChapterTitle}
          deleteChapter={deleteChapter}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        
        <main className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 border-b border-gray-200 bg-white">
            <div className="flex space-x-8">
              <button 
                type="button" 
                onClick={() => setActiveView('editor')}
                className={`py-4 px-1 text-sm font-medium ${
                  activeView === 'editor' 
                    ? 'text-gray-800 border-b-2 border-primary' 
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                }`}
              >
                Éditeur
              </button>
              <button 
                type="button" 
                onClick={() => setActiveView('preview')}
                className={`py-4 px-1 text-sm font-medium ${
                  activeView === 'preview' 
                    ? 'text-gray-800 border-b-2 border-primary' 
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                }`}
              >
                Aperçu
              </button>
            </div>
          </div>
          
          {activeView === 'editor' ? (
            <EditorContent 
              currentChapter={currentChapter}
              currentPage={currentPage}
              updateContent={updatePageContent}
              addPage={addPage}
            />
          ) : (
            <PreviewContent 
              book={bookContent}
              currentChapterIndex={currentChapterIndex}
              currentPageIndex={currentPageIndex}
              onNavigate={(chapterIndex, pageIndex) => {
                setCurrentChapterIndex(chapterIndex);
                setCurrentPageIndex(pageIndex);
              }}
            />
          )}
        </main>
      </div>
      
      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)}
        book={bookContent}
        bookId={id}
      />
    </div>
  );
}
