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
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { FadeInElement } from '@/components/ui/page-transition';

export default function Home() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [newBookTitle, setNewBookTitle] = useState('Nouveau Livre');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isDropboxSyncModalOpen, setIsDropboxSyncModalOpen] = useState(false);

  const { userInfo, refreshUserInfo } = useAuth();
  
  // Fetch books (filter by user if logged in)
  const { data: books, isLoading } = useQuery<BookType[]>({
    queryKey: userInfo ? ['/api/auth/user', userInfo.id, 'books'] : ['/api/books'],
    queryFn: async () => {
      const endpoint = userInfo 
        ? `/api/auth/user/${userInfo.id}/books` 
        : '/api/books';
      const response = await apiRequest('GET', endpoint);
      return response.json();
    },
    enabled: !isCreating // Ne pas charger pendant la création d'un livre
  });
  
  // Fetch Dropbox books (only when modal is open)
  const { data: dropboxBooks, isLoading: isLoadingDropboxBooks, refetch: refetchDropboxBooks } = useQuery<{id: number, path: string, userId?: number}[]>({
    queryKey: userInfo ? ['/api/dropbox/books', userInfo.id] : ['/api/dropbox/books'],
    queryFn: async () => {
      const endpoint = userInfo 
        ? `/api/dropbox/books?userId=${userInfo.id}` 
        : '/api/dropbox/books';
      const response = await apiRequest('GET', endpoint);
      return response.json();
    },
    enabled: isDropboxSyncModalOpen,
  });

  // Create book mutation
  const createBook = useMutation({
    mutationFn: async (bookData: { title: string; author: string }) => {
      try {
        // Vérifier que les données sont complètes
        if (!bookData.title || !bookData.author) {
          throw new Error("Le titre et l'auteur sont requis");
        }
        
        // Inclut l'ID utilisateur si disponible
        const payload = userInfo 
          ? { ...bookData, userId: userInfo.id } 
          : bookData;
        
        console.log("Envoi de la requête de création de livre avec payload:", payload);
        
        // Utilisation de fetch directement pour éviter des problèmes avec apiRequest
        const res = await fetch('/api/books', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          credentials: 'include'
        });
        
        // Log détaillé de la réponse
        console.log("Statut de la réponse:", res.status, res.statusText);
        
        if (!res.ok) {
          let errorData;
          try {
            errorData = await res.json();
          } catch (e) {
            errorData = { message: await res.text() };
          }
          console.error("Erreur détaillée:", errorData);
          throw new Error(errorData.message || "Erreur lors de la création du livre");
        }
        
        return await res.json();
      } catch (error) {
        console.error("Erreur de création de livre:", error);
        throw error;
      }
    },
    onSuccess: async (newBook) => {
      // Rafraîchir les informations utilisateur pour mettre à jour les compteurs
      if (userInfo) {
        await refreshUserInfo();
      }
      
      toast({
        title: "Livre créé avec succès",
        description: `"${newBook.title}" a été créé.`,
      });
      
      // Invalider la requête appropriée en fonction de l'utilisateur connecté
      if (userInfo) {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user', userInfo.id, 'books'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      }
      
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
      // Inclure l'ID de l'utilisateur pour supprimer également du dossier utilisateur dans Dropbox
      const endpoint = userInfo 
        ? `/api/books/${id}?userId=${userInfo.id}` 
        : `/api/books/${id}`;
      await apiRequest('DELETE', endpoint);
      return id;
    },
    onSuccess: async (id) => {
      // Rafraîchir les informations utilisateur pour mettre à jour les compteurs
      if (userInfo) {
        await refreshUserInfo();
      }
      
      toast({
        title: "Livre supprimé",
        description: "Le livre a été supprimé avec succès.",
      });
      // Invalider les requêtes appropriées en fonction de l'utilisateur connecté
      if (userInfo) {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user', userInfo.id, 'books'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      }
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
      // Inclure l'ID utilisateur pour synchroniser uniquement les livres de l'utilisateur connecté
      const endpoint = userInfo 
        ? `/api/dropbox/sync?userId=${userInfo.id}` 
        : '/api/dropbox/sync';
      const res = await apiRequest('POST', endpoint);
      return await res.json();
    },
    onSuccess: (data: { results: Array<{ status: string }> }) => {
      toast({
        title: "Synchronisation réussie",
        description: `${data.results.filter((r: { status: string }) => r.status === 'success').length} livres synchronisés avec Dropbox.`,
      });
      
      // Invalider la requête appropriée pour les livres Dropbox
      if (userInfo) {
        queryClient.invalidateQueries({ queryKey: ['/api/dropbox/books', userInfo.id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/dropbox/books'] });
      }
      
      // Invalider également la requête des livres pour actualiser la liste
      if (userInfo) {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user', userInfo.id, 'books'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      }
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
      <Header />

      <main className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInElement>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Vos Livres</h1>
              {!isCreating && (
                <div className="flex space-x-2">
                  <FadeInElement delay={0.1}>
                    <Button 
                      onClick={handleSyncToDropbox} 
                      disabled={syncToDropbox.isPending}
                      className="bg-blue-500 hover:bg-blue-600 text-white" 
                      title="Sauvegarder tous vos livres dans Dropbox"
                    >
                      <Cloud className="h-4 w-4 mr-2" />
                      {syncToDropbox.isPending ? 'Synchronisation...' : 'Synchroniser avec Dropbox'}
                    </Button>
                  </FadeInElement>
                  
                  <FadeInElement delay={0.2}>
                    <Button 
                      onClick={() => setIsAIModalOpen(true)} 
                      className="bg-indigo-500 hover:bg-indigo-600 text-white"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Créer avec l'IA
                    </Button>
                  </FadeInElement>
                  
                  <FadeInElement delay={0.3}>
                    <Button onClick={() => setIsCreating(true)} className="bg-primary hover:bg-primary/90">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Nouveau Livre
                    </Button>
                  </FadeInElement>
                </div>
              )}
            </div>
          </FadeInElement>

          {isCreating && (
            <FadeInElement>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Créer un nouveau livre</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FadeInElement delay={0.1}>
                    <div>
                      <label htmlFor="book-title" className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                      <Input
                        id="book-title"
                        value={newBookTitle}
                        onChange={(e) => setNewBookTitle(e.target.value)}
                        placeholder="Titre du livre"
                      />
                    </div>
                  </FadeInElement>
                  
                  <FadeInElement delay={0.2}>
                    <div>
                      <label htmlFor="book-author" className="block text-sm font-medium text-gray-700 mb-1">Auteur</label>
                      <Input
                        id="book-author"
                        value={newBookAuthor}
                        onChange={(e) => setNewBookAuthor(e.target.value)}
                        placeholder="Nom de l'auteur"
                      />
                    </div>
                  </FadeInElement>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <FadeInElement delay={0.3}>
                    <Button variant="outline" onClick={handleCancelCreate}>
                      Annuler
                    </Button>
                  </FadeInElement>
                  
                  <FadeInElement delay={0.4}>
                    <Button onClick={handleCreateBook} className="bg-primary hover:bg-primary/90" disabled={createBook.isPending}>
                      {createBook.isPending ? 'Création...' : 'Créer le livre'}
                    </Button>
                  </FadeInElement>
                </CardFooter>
              </Card>
            </FadeInElement>
          )}

          {isLoading ? (
            <FadeInElement>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="border shadow-sm opacity-50 animate-pulse">
                    <CardContent className="p-6 h-32"></CardContent>
                  </Card>
                ))}
              </div>
            </FadeInElement>
          ) : books && books.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {books.map((book, index) => (
                <FadeInElement key={book.id} delay={0.1 + index * 0.05}>
                  <Card className="border shadow-sm hover:shadow transition-shadow duration-200">
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
                </FadeInElement>
              ))}
            </div>
          ) : (
            <FadeInElement>
              <div className="text-center py-12 border rounded-lg bg-white">
                <FadeInElement delay={0.1}>
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                </FadeInElement>
                <FadeInElement delay={0.2}>
                  <h3 className="text-lg font-medium text-gray-800 mb-1">Aucun livre</h3>
                  <p className="text-gray-500 mb-4">Vous n'avez pas encore créé de livres.</p>
                </FadeInElement>
                {!isCreating && (
                  <FadeInElement delay={0.3}>
                    <Button onClick={() => setIsCreating(true)} className="bg-primary hover:bg-primary/90">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Créer mon premier livre
                    </Button>
                  </FadeInElement>
                )}
              </div>
            </FadeInElement>
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
          // Invalider la requête appropriée en fonction de l'utilisateur connecté
          if (userInfo) {
            queryClient.invalidateQueries({ queryKey: ['/api/auth/user', userInfo.id, 'books'] });
          } else {
            queryClient.invalidateQueries({ queryKey: ['/api/books'] });
          }
          navigate(`/editor/${bookId}`);
        }}
      />
    </div>
  );
}
