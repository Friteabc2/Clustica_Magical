import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Loader2, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  BookOpen,
  BookText,
  User,
  MapPin,
  Users,
  BadgeInfo,
  PenTool,
  Image,
  ImagePlus,
  Wand2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RocketAnimation } from '../ui/rocket-animation';
import { CharacterOptions, Character } from './character-options';
import { AdditionalStyles, StyleOption } from './additional-styles';

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
  const [narrativeMode, setNarrativeMode] = useState('');
  const [mainCharacter, setMainCharacter] = useState('');
  const [setting, setSetting] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('');
  const [paceStyle, setPaceStyle] = useState('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [additionalStyles, setAdditionalStyles] = useState<StyleOption[]>([]);
  const [generateImages, setGenerateImages] = useState(false);
  const [imageStyle, setImageStyle] = useState('realistic');
  const [imageAspectRatio, setImageAspectRatio] = useState('landscape');

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
    // Réinitialiser la barre de progression et créer des nouveaux objets qui tombent
    
    try {
      // Préparer les informations des personnages
      const characterData = characters.map(char => ({
        name: char.autoGenerateName ? undefined : char.name.trim() || undefined,
        autoGenerateName: char.autoGenerateName,
        description: char.description.trim() || undefined, 
        alignment: char.alignment,
        organization: char.organization.trim() || undefined,
        role: char.role
      }));
      
      // Préparer les styles et thèmes additionnels
      const additionalStylesList = additionalStyles
        .filter(s => s.type === 'style')
        .map(s => s.value);
        
      const themesList = additionalStyles
        .filter(s => s.type === 'theme')
        .map(s => s.value);
      
      const payload = {
        prompt,
        chaptersCount,
        pagesPerChapter,
        authorName: authorName.trim() || undefined,
        genre: genre && genre !== "none" ? genre : undefined,
        style: style && style !== "none" ? style : undefined,
        narrativeMode: narrativeMode && narrativeMode !== "none" ? narrativeMode : undefined,
        mainCharacter: mainCharacter.trim() || undefined,
        setting: setting.trim() || undefined,
        targetAudience: targetAudience && targetAudience !== "none" ? targetAudience : undefined,
        tone: tone && tone !== "none" ? tone : undefined,
        paceStyle: paceStyle && paceStyle !== "none" ? paceStyle : undefined,
        ...(additionalStylesList.length > 0 && { additionalStyles: additionalStylesList }),
        ...(themesList.length > 0 && { themes: themesList }),
        ...(characters.length > 0 && { characters: characterData }),
        // Options d'images
        generateImages,
        ...(generateImages && { 
          imageStyle,
          imageAspectRatio 
        }),
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
      setTimeout(() => {
        setIsGenerating(false);
      }, 1000); // Laisser un délai pour permettre à l'animation de se terminer proprement
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] lg:max-w-[650px] max-h-[85vh] overflow-y-auto">
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
            <Label htmlFor="authorName">Nom de l'auteur <span className="text-xs text-gray-500 ml-1">(optionnel)</span></Label>
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
              <Label htmlFor="genre">Genre <span className="text-xs text-gray-500 ml-1">(optionnel)</span></Label>
              <Select value={genre} onValueChange={setGenre} disabled={isGenerating}>
                <SelectTrigger id="genre">
                  <SelectValue placeholder="Sélectionner un genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Aucun --</SelectItem>
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
              <Label htmlFor="style">Style d'écriture <span className="text-xs text-gray-500 ml-1">(optionnel)</span></Label>
              <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
                <SelectTrigger id="style">
                  <SelectValue placeholder="Sélectionner un style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Aucun --</SelectItem>
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
              max={userInfo?.plan === 'free' ? 3 : 6}
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
            {userInfo?.plan === 'premium' && chaptersCount >= 6 && (
              <p className="text-xs text-amber-600 mt-1">
                Vous avez atteint la limite de chapitres pour le plan premium
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
              max={userInfo?.plan === 'free' ? 3 : 4}
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
            {userInfo?.plan === 'premium' && pagesPerChapter >= 4 && (
              <p className="text-xs text-amber-600 mt-1">
                Vous avez atteint la limite de pages par chapitre pour le plan premium
              </p>
            )}
          </div>
          
          <Accordion type="single" collapsible className="w-full border rounded-md px-4">
            <AccordionItem value="advanced-options" className="border-b-0">
              <AccordionTrigger className="text-sm font-medium">
                Options narratives avancées
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {/* Point de vue narratif */}
                  <div className="space-y-2">
                    <Label htmlFor="narrativeMode" className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-indigo-500" />
                      Point de vue narratif <span className="text-xs text-gray-500 ml-1">(optionnel)</span>
                    </Label>
                    <Select value={narrativeMode} onValueChange={setNarrativeMode} disabled={isGenerating}>
                      <SelectTrigger id="narrativeMode">
                        <SelectValue placeholder="Choisir un point de vue" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Aucune préférence --</SelectItem>
                        <SelectItem value="first-person">Première personne (je/nous)</SelectItem>
                        <SelectItem value="second-person">Deuxième personne (tu/vous)</SelectItem>
                        <SelectItem value="third-person-limited">Troisième personne limitée</SelectItem>
                        <SelectItem value="third-person-omniscient">Troisième personne omnisciente</SelectItem>
                        <SelectItem value="multi-perspective">Perspectives multiples</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Personnage principal */}
                  <div className="space-y-2">
                    <Label htmlFor="mainCharacter" className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-indigo-500" />
                      Personnage principal <span className="text-xs text-gray-500 ml-1">(optionnel)</span>
                    </Label>
                    <Textarea
                      id="mainCharacter"
                      placeholder="Décrivez le personnage principal (âge, personnalité, caractéristiques...)"
                      rows={2}
                      value={mainCharacter}
                      onChange={(e) => setMainCharacter(e.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                  
                  {/* Cadre/Lieu/Époque */}
                  <div className="space-y-2">
                    <Label htmlFor="setting" className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-indigo-500" />
                      Cadre/Lieu/Époque <span className="text-xs text-gray-500 ml-1">(optionnel)</span>
                    </Label>
                    <Textarea
                      id="setting"
                      placeholder="Décrivez où et quand se déroule l'histoire"
                      rows={2}
                      value={setting}
                      onChange={(e) => setSetting(e.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                  
                  {/* Public cible */}
                  <div className="space-y-2">
                    <Label htmlFor="targetAudience" className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-indigo-500" />
                      Public cible <span className="text-xs text-gray-500 ml-1">(optionnel)</span>
                    </Label>
                    <Select value={targetAudience} onValueChange={setTargetAudience} disabled={isGenerating}>
                      <SelectTrigger id="targetAudience">
                        <SelectValue placeholder="Choisir un public cible" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Aucune préférence --</SelectItem>
                        <SelectItem value="children">Enfants</SelectItem>
                        <SelectItem value="young-adult">Adolescents/Jeunes adultes</SelectItem>
                        <SelectItem value="adult">Adultes</SelectItem>
                        <SelectItem value="all-ages">Tous âges</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Ton de l'histoire */}
                  <div className="space-y-2">
                    <Label htmlFor="tone" className="flex items-center">
                      <BadgeInfo className="h-4 w-4 mr-2 text-indigo-500" />
                      Ton de l'histoire <span className="text-xs text-gray-500 ml-1">(optionnel)</span>
                    </Label>
                    <Select value={tone} onValueChange={setTone} disabled={isGenerating}>
                      <SelectTrigger id="tone">
                        <SelectValue placeholder="Choisir un ton" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Aucune préférence --</SelectItem>
                        <SelectItem value="serious">Sérieux/Dramatique</SelectItem>
                        <SelectItem value="humorous">Humoristique</SelectItem>
                        <SelectItem value="dark">Sombre</SelectItem>
                        <SelectItem value="uplifting">Inspirant/Positif</SelectItem>
                        <SelectItem value="satirical">Satirique</SelectItem>
                        <SelectItem value="melancholic">Mélancolique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Rythme */}
                  <div className="space-y-2">
                    <Label htmlFor="paceStyle" className="flex items-center">
                      <PenTool className="h-4 w-4 mr-2 text-indigo-500" />
                      Rythme narratif <span className="text-xs text-gray-500 ml-1">(optionnel)</span>
                    </Label>
                    <Select value={paceStyle} onValueChange={setPaceStyle} disabled={isGenerating}>
                      <SelectTrigger id="paceStyle">
                        <SelectValue placeholder="Choisir un rythme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Aucune préférence --</SelectItem>
                        <SelectItem value="fast">Rapide</SelectItem>
                        <SelectItem value="moderate">Modéré</SelectItem>
                        <SelectItem value="slow">Lent et contemplatif</SelectItem>
                        <SelectItem value="varied">Varié</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Styles et thèmes supplémentaires */}
                  <AdditionalStyles
                    styles={additionalStyles}
                    onChange={setAdditionalStyles}
                    disabled={isGenerating}
                  />
                  
                  {/* Personnages */}
                  <CharacterOptions
                    characters={characters}
                    onChange={setCharacters}
                    disabled={isGenerating}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="image-options" className="border-b-0">
              <AccordionTrigger className="text-sm font-medium">
                Options d'illustrations
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {/* Activation des images */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="generateImages" className="flex items-center">
                      <ImagePlus className="h-4 w-4 mr-2 text-indigo-500" />
                      Générer des illustrations
                    </Label>
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setGenerateImages(!generateImages)}
                        disabled={isGenerating}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          generateImages ? 'bg-indigo-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            generateImages ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  
                  {/* Style d'image */}
                  {generateImages && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="imageStyle" className="flex items-center">
                          <Wand2 className="h-4 w-4 mr-2 text-indigo-500" />
                          Style d'illustration
                        </Label>
                        <Select value={imageStyle} onValueChange={setImageStyle} disabled={isGenerating}>
                          <SelectTrigger id="imageStyle">
                            <SelectValue placeholder="Choisir un style d'image" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realistic">Réaliste</SelectItem>
                            <SelectItem value="cartoon">Cartoon</SelectItem>
                            <SelectItem value="manga">Manga/Anime</SelectItem>
                            <SelectItem value="painting">Peinture</SelectItem>
                            <SelectItem value="watercolor">Aquarelle</SelectItem>
                            <SelectItem value="sketch">Croquis</SelectItem>
                            <SelectItem value="digital-art">Art digital</SelectItem>
                            <SelectItem value="fantasy">Fantasy</SelectItem>
                            <SelectItem value="3d-render">3D</SelectItem>
                            <SelectItem value="minimalist">Minimaliste</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Format d'image */}
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="imageAspectRatio" className="flex items-center">
                          <Image className="h-4 w-4 mr-2 text-indigo-500" />
                          Format d'illustration
                        </Label>
                        <Select value={imageAspectRatio} onValueChange={setImageAspectRatio} disabled={isGenerating}>
                          <SelectTrigger id="imageAspectRatio">
                            <SelectValue placeholder="Choisir un format d'image" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="landscape">Paysage (horizontal)</SelectItem>
                            <SelectItem value="portrait">Portrait (vertical)</SelectItem>
                            <SelectItem value="square">Carré</SelectItem>
                            <SelectItem value="panoramic">Panoramique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  
                  {/* Note sur les images */}
                  {generateImages && (
                    <div className="text-sm text-gray-500 mt-2">
                      <p>Les illustrations sont générées en fonction du contenu de chaque page. Elles seront incluses dans le livre exporté en EPUB.</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        {/* Animation de fusée pendant la génération */}
        <RocketAnimation isActive={isGenerating} />
        
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