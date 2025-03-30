import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, ChevronDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BookContent } from '@shared/schema';

interface SidebarProps {
  book: BookContent;
  setBook: (book: BookContent) => void;
  currentChapterIndex: number;
  setCurrentChapterIndex: (index: number) => void;
  currentPageIndex: number;
  setCurrentPageIndex: (index: number) => void;
  addChapter: () => void;
  addPage: () => void;
  updateChapterTitle: (index: number, title: string) => void;
  deleteChapter: (index: number) => void;
  deletePage: (chapterIndex: number, pageIndex: number) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({
  book,
  setBook,
  currentChapterIndex,
  setCurrentChapterIndex,
  currentPageIndex,
  setCurrentPageIndex,
  addChapter,
  addPage,
  updateChapterTitle,
  deleteChapter,
  deletePage,
  collapsed,
  setCollapsed
}: SidebarProps) {
  const [editingChapterIndex, setEditingChapterIndex] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Begin editing chapter title
  const startEditing = (index: number, title: string) => {
    setEditingChapterIndex(index);
    setEditingTitle(title);
  };

  // Save chapter title
  const saveChapterTitle = () => {
    if (editingChapterIndex !== null && editingTitle.trim()) {
      updateChapterTitle(editingChapterIndex, editingTitle);
      setEditingChapterIndex(null);
    }
  };

  // Handle book title change
  const handleBookTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBook({
      ...book,
      title: e.target.value
    });
  };

  // Handle book author change
  const handleBookAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBook({
      ...book,
      author: e.target.value
    });
  };

  // Handle chapter click
  const handleChapterClick = (index: number) => {
    setCurrentChapterIndex(index);
    setCurrentPageIndex(0); // Always start at the first page of the chapter
  };

  if (collapsed) {
    return (
      <div className="bg-white w-16 border-r border-gray-200 flex flex-col h-full overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="mx-auto my-4"
          onClick={() => setCollapsed(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className="bg-white w-64 border-r border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-700">Structure du Livre</h2>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          onClick={() => setCollapsed(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="overflow-y-auto flex-1 px-4 py-2">
        {/* Book Info Section */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="mb-3">
            <label htmlFor="book-title" className="block text-xs font-medium text-gray-500 mb-1">
              Titre
            </label>
            <Input
              id="book-title"
              value={book.title}
              onChange={handleBookTitleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="book-author" className="block text-xs font-medium text-gray-500 mb-1">
              Auteur
            </label>
            <Input
              id="book-author"
              value={book.author}
              onChange={handleBookAuthorChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
          
          {/* Cover Page Section */}
          {book.coverPage && (
            <div 
              className={`flex items-center justify-between p-2 mt-2 rounded bg-gradient-to-r from-primary/10 to-secondary/10 cursor-pointer hover:from-primary/20 hover:to-secondary/20 ${
                currentChapterIndex === -1 ? 'border-2 border-primary/30' : ''
              }`}
              onClick={() => {
                setCurrentChapterIndex(-1);
                setCurrentPageIndex(0);
              }}
            >
              <div className="flex items-center">
                <div className="h-8 w-8 rounded bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white mr-2">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Couverture</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Chapters Section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-medium text-gray-500">Chapitres</h3>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 rounded-md text-primary hover:bg-gray-100 text-xs"
              onClick={addChapter}
            >
              <Plus className="h-3 w-3 mr-1" /> Ajouter
            </Button>
          </div>
          
          {book.chapters.map((chapter, index) => (
            <Collapsible
              key={chapter.id}
              defaultOpen={currentChapterIndex === index}
              className={`rounded-md mb-1 ${
                currentChapterIndex === index
                  ? 'bg-gray-100 border border-gray-200'
                  : 'border border-transparent hover:bg-gray-50'
              }`}
            >
              <div className="p-2">
                <CollapsibleTrigger asChild>
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => handleChapterClick(index)}>
                    {editingChapterIndex === index ? (
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={saveChapterTitle}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveChapterTitle();
                          }
                        }}
                        autoFocus
                        className="text-sm py-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="flex items-center">
                        <ChevronDown className="h-3 w-3 mr-1 text-gray-500" />
                        <span className="font-medium text-sm text-gray-800">{chapter.title}</span>
                      </div>
                    )}
                    
                    {editingChapterIndex !== index && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-xs"
                          title="Éditer"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(index, chapter.title);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-xs"
                          title="Supprimer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${chapter.title}" ?`)) {
                              deleteChapter(index);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CollapsibleTrigger>
                
                <div className="flex justify-between items-center mt-1">
                  <div className="text-xs text-gray-500">
                    {chapter.pages.length} {chapter.pages.length > 1 ? 'pages' : 'page'}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0.5 text-primary hover:bg-gray-100 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentChapterIndex(index);
                      addPage();
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Nouvelle page
                  </Button>
                </div>
              </div>
              
              <CollapsibleContent>
                <div className="pl-4 pr-2 pb-2">
                  {chapter.pages.map((page, pageIndex) => (
                    <div
                      key={`${chapter.id}-page-${pageIndex}`}
                      className={`flex items-center justify-between px-2 py-1.5 rounded ${
                        currentChapterIndex === index && currentPageIndex === pageIndex
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div 
                        className="flex items-center cursor-pointer flex-1"
                        onClick={() => {
                          setCurrentChapterIndex(index);
                          setCurrentPageIndex(pageIndex);
                        }}
                      >
                        <FileText className="h-3 w-3 mr-2" />
                        <span className="text-xs truncate">
                          Page {pageIndex + 1}
                        </span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        title="Supprimer la page"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette page ?`)) {
                            deletePage(index, pageIndex);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </aside>
  );
}
