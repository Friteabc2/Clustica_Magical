import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, BookOpen, Trash2, Sparkles, Cloud, Download } from 'lucide-react';
import { type Book as BookType } from '@shared/schema';
import AIBookModal from '@/components/book/ai-book-modal';

export default function Home() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [newBookTitle, setNewBookTitle] = useState('Nouveau Livre');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isDropboxSyncModalOpen, setIsDropboxSyncModalOpen] = useState(false);

  // Fetch books
  const { data: books, isLoading } = useQuery<BookType[]>({
    queryKey: ['/api/books']
  });
  
  // Fetch Dropbox books (only when modal is open)
  const { data: dropboxBooks, isLoading: isLoadingDropboxBooks, refetch: refetchDropboxBooks } = useQuery<{id: number, path: string}[]>({
    queryKey: ['/api/dropbox/books'],
    enabled: isDropboxSyncModalOpen,
  });

  // Create book mutation
  const createBook = useMutation({
    mutationFn: async (bookData: { title: string; author: string }) => {
      const res = await apiRequest('POST', '/api/books', bookData);
      return await res.json();
    },
    onSuccess: (newBook) => {
      toast({
        title: "Livre créé avec succès",
        description: `"${newBook.title}" a été créé.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      setIsCreating(false);
      setNewBookTitle('Nouveau Livre');
      setNewBookAuthor('');
    },
    onError: (error) => {
      toast({
        title: "Erreur lors de la création du livre",
        description: error.message || "Une erreur s'est produite",
        variant: "destructive",
      });
    }
  });

  // Delete book mutation
  const deleteBook = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/books/${id}`);
      return id;
    },
    onSuccess: (id) => {
      toast({
        title: "Livre supprimé",
        description: "Le livre a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
    },
    onError: (error) => {
      toast({
        title: "Erreur lors de la suppression",
        description: error.message || "Une erreur s'est produite",
        variant: "destructive",
      });
    }
  });

  // Handle create book
  const handleCreateBook = () => {
    if (!newBookTitle.trim() || !newBookAuthor.trim()) {
      toast({
        title: "Données manquantes",
        description: "Le titre et l'auteur sont requis.",
        variant: "destructive",
      });
      return;
    }

    createBook.mutate({
      title: newBookTitle,
      author: newBookAuthor
    });
  };

  // Sync books to Dropbox mutation
  const syncToDropbox = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/dropbox/sync');
      return await res.json();
    },
    onSuccess: (data: { results: Array<{ status: string }> }) => {
      toast({
        title: "Synchronisation réussie",
        description: `${data.results.filter((r: { status: string }) => r.status === 'success').length} livres synchronisés avec Dropbox.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dropbox/books'] });
    },
    onError: (error) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "Impossible de synchroniser avec Dropbox.",
        variant: "destructive",
      });
    }
  });

  // Handle cancel create
  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewBookTitle('Nouveau Livre');
    setNewBookAuthor('');
  };
  
  // Handle synchronization with Dropbox
  const handleSyncToDropbox = () => {
    if (window.confirm("Voulez-vous synchroniser tous vos livres avec Dropbox ?")) {
      syncToDropbox.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="bg-gradient-to-r from-primary to-secondary rounded-lg w-8 h-8 flex items-center justify-center text-white">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-800">Clustica</span>
                <span className="ml-1 text-sm text-secondary font-medium">Magical</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Vos Livres</h1>
            {!isCreating && (
              <div className="flex space-x-2">
                <Button 
                  onClick={handleSyncToDropbox} 
                  disabled={syncToDropbox.isPending}
                  className="bg-blue-500 hover:bg-blue-600 text-white" 
                  title="Sauvegarder tous vos livres dans Dropbox"
                >
                  <Cloud className="h-4 w-4 mr-2" />
                  {syncToDropbox.isPending ? 'Synchronisation...' : 'Synchroniser avec Dropbox'}
                </Button>
                <Button 
                  onClick={() => setIsAIModalOpen(true)} 
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Créer avec l'IA
                </Button>
                <Button onClick={() => setIsCreating(true)} className="bg-primary hover:bg-primary/90">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nouveau Livre
                </Button>
              </div>
            )}
          </div>

          {isCreating && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Créer un nouveau livre</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="book-title" className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                  <Input
                    id="book-title"
                    value={newBookTitle}
                    onChange={(e) => setNewBookTitle(e.target.value)}
                    placeholder="Titre du livre"
                  />
                </div>
                <div>
                  <label htmlFor="book-author" className="block text-sm font-medium text-gray-700 mb-1">Auteur</label>
                  <Input
                    id="book-author"
                    value={newBookAuthor}
                    onChange={(e) => setNewBookAuthor(e.target.value)}
                    placeholder="Nom de l'auteur"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelCreate}>
                  Annuler
                </Button>
                <Button onClick={handleCreateBook} className="bg-primary hover:bg-primary/90" disabled={createBook.isPending}>
                  {createBook.isPending ? 'Création...' : 'Créer le livre'}
                </Button>
              </CardFooter>
            </Card>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border shadow-sm opacity-50 animate-pulse">
                  <CardContent className="p-6 h-32"></CardContent>
                </Card>
              ))}
            </div>
          ) : books && books.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {books.map((book) => (
                <Card key={book.id} className="border shadow-sm hover:shadow transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{book.title}</h3>
                        <p className="text-sm text-gray-500">par {book.author}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => {
                          if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${book.title}" ?`)) {
                            deleteBook.mutate(book.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 px-6 py-3">
                    <Button 
                      variant="link" 
                      className="text-primary w-full"
                      onClick={() => navigate(`/editor/${book.id}`)}
                    >
                      Ouvrir l'éditeur
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-white">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-1">Aucun livre</h3>
              <p className="text-gray-500 mb-4">Vous n'avez pas encore créé de livres.</p>
              {!isCreating && (
                <Button onClick={() => setIsCreating(true)} className="bg-primary hover:bg-primary/90">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Créer mon premier livre
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Clustica Magical &copy; {new Date().getFullYear()} - Créateur de Livres Virtuels
          </p>
        </div>
      </footer>

      {/* Modal pour la génération de livre par IA */}
      <AIBookModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)}
        onBookCreated={(bookId) => {
          queryClient.invalidateQueries({ queryKey: ['/api/books'] });
          navigate(`/editor/${bookId}`);
        }}
      />
    </div>
  );
}
