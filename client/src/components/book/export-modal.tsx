import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { BookContent } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { FileOutput, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: BookContent;
  bookId: string | undefined;
}

export default function ExportModal({ isOpen, onClose, book, bookId }: ExportModalProps) {
  const { toast } = useToast();
  const { userInfo } = useAuth();
  const [exportTitle, setExportTitle] = useState(book.title);
  const [exportAuthor, setExportAuthor] = useState(book.author);
  const [language, setLanguage] = useState('fr');
  const [includeCover, setIncludeCover] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Reset form when book changes or modal opens
  const resetForm = () => {
    setExportTitle(book.title);
    setExportAuthor(book.author);
    setLanguage('fr');
    setIncludeCover(true);
  };

  // Handle export
  const handleExport = async () => {
    if (!bookId) {
      toast({
        title: 'Erreur d\'exportation',
        description: 'Veuillez enregistrer le livre avant d\'exporter',
        variant: 'destructive'
      });
      return;
    }

    setIsExporting(true);

    try {
      const exportOptions = {
        language,
        includeCover
      };

      // Use fetch directly for file download, en incluant l'ID utilisateur dans les paramètres
      const response = await fetch(`/api/books/${bookId}/export?userId=${userInfo?.id || ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...exportOptions,
          _userId: userInfo?.id // Ajouter l'ID utilisateur dans le corps de la requête aussi
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de l'exportation: ${response.status} ${response.statusText}`);
      }

      // Get filename from response headers or generate one
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'livre.epub';
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link and trigger click
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Exportation réussie',
        description: 'Votre livre a été exporté avec succès',
      });
      
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erreur d\'exportation',
        description: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'exportation',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (open) {
        resetForm();
      } else {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exporter en EPUB</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-500 mb-4">
            Vérifiez les informations de votre livre avant l'exportation.
          </p>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="export-title">Titre du livre</Label>
              <Input
                id="export-title"
                value={exportTitle}
                onChange={(e) => setExportTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="export-author">Auteur</Label>
              <Input
                id="export-author"
                value={exportAuthor}
                onChange={(e) => setExportAuthor(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="export-language">Langue</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="export-language" className="mt-1">
                  <SelectValue placeholder="Sélectionner une langue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">Anglais</SelectItem>
                  <SelectItem value="es">Espagnol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-cover"
                checked={includeCover}
                onCheckedChange={(checked) => setIncludeCover(checked as boolean)}
              />
              <Label htmlFor="include-cover" className="text-sm cursor-pointer">
                Inclure une couverture générée
              </Label>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Annuler
            </Button>
          </DialogClose>
          <Button 
            type="button" 
            className="bg-primary hover:bg-primary/90"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <span className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Exportation...
              </span>
            ) : (
              <>
                <FileOutput className="h-4 w-4 mr-1.5" />
                Exporter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
