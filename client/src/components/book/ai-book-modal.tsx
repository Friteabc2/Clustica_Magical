import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AIBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookCreated: (bookId: number) => void;
}

export default function AIBookModal({ isOpen, onClose, onBookCreated }: AIBookModalProps) {
  const { toast } = useToast();
  const { userInfo, refreshUserInfo } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [chaptersCount, setChaptersCount] = useState(3);
  const [pagesPerChapter, setPagesPerChapter] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [genre, setGenre] = useState('');
  const [style, setStyle] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt requis",
        description: "Veuillez fournir une description ou une idée pour votre livre.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const payload = {
        prompt,
        chaptersCount,
        pagesPerChapter,
        authorName: authorName.trim() || undefined,
        genre: genre || undefined,
        style: style || undefined,
        ...(userInfo && { userId: userInfo.id })
      };
      
      const response = await apiRequest('POST', '/api/books/generate-ai', payload);

      if (response.ok) {
        const book = await response.json();
        // Rafraîchir les informations utilisateur pour mettre à jour les compteurs
        await refreshUserInfo();
        
        toast({
          title: "Livre créé avec succès!",
          description: `"${book.title}" a été généré et ajouté à votre bibliothèque.`,
          variant: "default"
        });
        onBookCreated(book.id);
        onClose();
      } else {
        const error = await response.json();
        
        // Vérifier si c'est une erreur spécifique aux limites du plan gratuit
        if (error.error === 'FREE_PLAN_AI_LIMIT_REACHED') {
          throw new Error("Limite du plan gratuit atteinte: vous avez déjà créé le nombre maximal de livres IA autorisés. Passez au plan premium pour créer plus de livres avec l'IA.");
        } else if (error.error === 'FREE_PLAN_LIMIT_REACHED') {
          throw new Error("Limite du plan gratuit atteinte: vous avez déjà créé le nombre maximal de livres autorisés. Passez au plan premium pour créer plus de livres.");
        } else {
          throw new Error(error.message || "Erreur lors de la génération du livre");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la génération du livre:", error);
      
      // Déterminer si c'est une erreur liée aux limitations du plan
      const errorMessage = error instanceof Error ? error.message : "Une erreur s'est produite lors de la génération du livre.";
      const isPlanLimitError = errorMessage.includes("Limite du plan gratuit atteinte");
      
      toast({
        title: isPlanLimitError ? "Limite du plan atteinte" : "Échec de la génération",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-indigo-500" />
            Créer un livre avec l'IA
          </DialogTitle>
          <DialogDescription>
            Décrivez le livre que vous souhaitez créer et notre IA s'occupera du reste.
            {userInfo?.plan === 'free' && (
              <div className="mt-2 text-amber-600 text-xs font-medium">
                Plan Gratuit: Limité à 1 livre IA et maximum 3 chapitres par livre
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Description ou idée de votre livre</Label>
            <Textarea 
              id="prompt" 
              placeholder="Ex: Un roman d'aventure sur un jeune magicien qui découvre un monde parallèle..." 
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authorName">Nom de l'auteur (optionnel)</Label>
            <Input 
              id="authorName" 
              placeholder="Ex: Jean Dupont" 
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select value={genre} onValueChange={setGenre} disabled={isGenerating}>
                <SelectTrigger id="genre">
                  <SelectValue placeholder="Sélectionner un genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Aucun --</SelectItem>
                  <SelectItem value="fantasy">Fantasy</SelectItem>
                  <SelectItem value="scifi">Science-Fiction</SelectItem>
                  <SelectItem value="romance">Romance</SelectItem>
                  <SelectItem value="thriller">Thriller</SelectItem>
                  <SelectItem value="mystery">Mystère</SelectItem>
                  <SelectItem value="horror">Horreur</SelectItem>
                  <SelectItem value="adventure">Aventure</SelectItem>
                  <SelectItem value="historical">Historique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="style">Style d'écriture</Label>
              <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
                <SelectTrigger id="style">
                  <SelectValue placeholder="Sélectionner un style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Aucun --</SelectItem>
                  <SelectItem value="literary">Littéraire</SelectItem>
                  <SelectItem value="minimalist">Minimaliste</SelectItem>
                  <SelectItem value="descriptive">Descriptif</SelectItem>
                  <SelectItem value="poetic">Poétique</SelectItem>
                  <SelectItem value="humorous">Humoristique</SelectItem>
                  <SelectItem value="technical">Technique</SelectItem>
                  <SelectItem value="conversational">Conversationnel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="chapters">Nombre de chapitres</Label>
              <span className="text-sm text-gray-500">{chaptersCount}</span>
            </div>
            <Slider 
              id="chapters"
              min={1}
              max={userInfo?.plan === 'free' ? 3 : 10}
              step={1}
              value={[chaptersCount]}
              onValueChange={(values) => setChaptersCount(values[0])}
              disabled={isGenerating}
            />
            {userInfo?.plan === 'free' && chaptersCount >= 3 && (
              <p className="text-xs text-amber-600 mt-1">
                Vous avez atteint la limite de chapitres pour le plan gratuit
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="pages">Pages par chapitre</Label>
              <span className="text-sm text-gray-500">{pagesPerChapter}</span>
            </div>
            <Slider 
              id="pages"
              min={1}
              max={userInfo?.plan === 'free' ? 3 : 5}
              step={1}
              value={[pagesPerChapter]}
              onValueChange={(values) => setPagesPerChapter(values[0])}
              disabled={isGenerating}
            />
            {userInfo?.plan === 'free' && pagesPerChapter >= 3 && (
              <p className="text-xs text-amber-600 mt-1">
                Vous avez atteint la limite de pages par chapitre pour le plan gratuit
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isGenerating}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="ml-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              'Générer mon livre'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}