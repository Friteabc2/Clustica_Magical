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

interface AIBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookCreated: (bookId: number) => void;
}

export default function AIBookModal({ isOpen, onClose, onBookCreated }: AIBookModalProps) {
  const { toast } = useToast();
  const { userInfo } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [chaptersCount, setChaptersCount] = useState(3);
  const [pagesPerChapter, setPagesPerChapter] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

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
        ...(userInfo && { userId: userInfo.id })
      };
      
      const response = await apiRequest('POST', '/api/books/generate-ai', payload);

      if (response.ok) {
        const book = await response.json();
        toast({
          title: "Livre créé avec succès!",
          description: `"${book.title}" a été généré et ajouté à votre bibliothèque.`,
          variant: "default"
        });
        onBookCreated(book.id);
        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la génération du livre");
      }
    } catch (error) {
      console.error("Erreur lors de la génération du livre:", error);
      toast({
        title: "Échec de la génération",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la génération du livre.",
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
            <div className="flex justify-between">
              <Label htmlFor="chapters">Nombre de chapitres</Label>
              <span className="text-sm text-gray-500">{chaptersCount}</span>
            </div>
            <Slider 
              id="chapters"
              min={1}
              max={10}
              step={1}
              value={[chaptersCount]}
              onValueChange={(values) => setChaptersCount(values[0])}
              disabled={isGenerating}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="pages">Pages par chapitre</Label>
              <span className="text-sm text-gray-500">{pagesPerChapter}</span>
            </div>
            <Slider 
              id="pages"
              min={1}
              max={5}
              step={1}
              value={[pagesPerChapter]}
              onValueChange={(values) => setPagesPerChapter(values[0])}
              disabled={isGenerating}
            />
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