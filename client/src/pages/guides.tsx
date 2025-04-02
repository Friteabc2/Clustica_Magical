import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, BookOpen, PenTool, Edit3, Save, Download, Brain, Image, Share } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Guides() {
  const [_, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Guides d'utilisation | Clustica - Magical</title>
      </Helmet>
      
      <main className="flex-1 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => navigate('/')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
          
          <h1 className="text-3xl font-bold text-center mb-8">Guides d'utilisation</h1>
          <p className="text-lg text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Découvrez comment tirer le meilleur parti de Clustica - Magical avec nos guides visuels et détaillés.
          </p>
          
          <Tabs defaultValue="creation" className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-xl mx-auto mb-8">
              <TabsTrigger value="creation">Création</TabsTrigger>
              <TabsTrigger value="edition">Édition</TabsTrigger>
              <TabsTrigger value="ai">IA</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
            
            {/* Onglet CRÉATION */}
            <TabsContent value="creation">
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Créer votre premier livre
                    </CardTitle>
                    <CardDescription>Guide étape par étape pour créer un nouveau livre</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted p-4 border-b">
                          <h3 className="font-semibold">Étape 1: Accéder à votre tableau de bord</h3>
                        </div>
                        <div className="p-6 space-y-4">
                          <p>
                            Après vous être connecté, vous arriverez sur votre tableau de bord personnel.
                            C'est ici que vous pourrez voir tous vos livres existants et en créer de nouveaux.
                          </p>
                          <div className="border rounded-lg p-4 bg-muted/30">
                            <div className="flex gap-2 items-center text-primary">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">1</div>
                              <span>Cliquez sur le bouton <strong>"+ Nouveau livre"</strong> en haut à droite de l'écran.</span>
                            </div>
                          </div>
                          <div className="relative rounded-md overflow-hidden border">
                            {/* Simulation d'image */}
                            <div className="bg-gradient-to-r from-gray-100 to-gray-200 h-64 w-full flex items-center justify-center">
                              <div className="text-center p-6 bg-white/80 rounded-lg shadow-sm">
                                <BookOpen className="h-12 w-12 mx-auto text-primary mb-4" />
                                <p className="font-medium">Capture d'écran: Bouton "Nouveau livre" sur le tableau de bord</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted p-4 border-b">
                          <h3 className="font-semibold">Étape 2: Renseigner les informations du livre</h3>
                        </div>
                        <div className="p-6 space-y-4">
                          <p>
                            Une fenêtre de dialogue s'ouvrira, vous demandant de saisir les informations de base pour votre nouveau livre.
                          </p>
                          <div className="border rounded-lg p-4 bg-muted/30">
                            <div className="space-y-3">
                              <div className="flex gap-2 items-center text-primary">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">1</div>
                                <span>Entrez le <strong>titre</strong> de votre livre.</span>
                              </div>
                              <div className="flex gap-2 items-center text-primary">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">2</div>
                                <span>Ajoutez votre nom ou un pseudonyme comme <strong>auteur</strong>.</span>
                              </div>
                              <div className="flex gap-2 items-center text-primary">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">3</div>
                                <span>Cliquez sur <strong>"Créer"</strong> pour valider.</span>
                              </div>
                            </div>
                          </div>
                          <div className="relative rounded-md overflow-hidden border">
                            {/* Simulation d'image */}
                            <div className="bg-gradient-to-r from-gray-100 to-gray-200 h-64 w-full flex items-center justify-center">
                              <div className="text-center p-6 bg-white/80 rounded-lg shadow-sm">
                                <PenTool className="h-12 w-12 mx-auto text-primary mb-4" />
                                <p className="font-medium">Capture d'écran: Formulaire de création de livre</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted p-4 border-b">
                          <h3 className="font-semibold">Étape 3: Structurer votre livre</h3>
                        </div>
                        <div className="p-6 space-y-4">
                          <p>
                            Une fois votre livre créé, vous serez redirigé vers l'éditeur. Commencez par organiser la structure de votre livre.
                          </p>
                          <div className="border rounded-lg p-4 bg-muted/30">
                            <div className="space-y-3">
                              <div className="flex gap-2 items-center text-primary">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">1</div>
                                <span>Utilisez le panneau latéral gauche pour <strong>ajouter des chapitres</strong> à votre livre.</span>
                              </div>
                              <div className="flex gap-2 items-center text-primary">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">2</div>
                                <span>Pour chaque chapitre, vous pouvez <strong>ajouter des pages</strong>.</span>
                              </div>
                              <div className="flex gap-2 items-center text-primary">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">3</div>
                                <span>N'oubliez pas d'<strong>enregistrer régulièrement</strong> votre travail.</span>
                              </div>
                            </div>
                          </div>
                          <div className="relative rounded-md overflow-hidden border">
                            {/* Simulation d'image */}
                            <div className="bg-gradient-to-r from-gray-100 to-gray-200 h-64 w-full flex items-center justify-center">
                              <div className="text-center p-6 bg-white/80 rounded-lg shadow-sm">
                                <Edit3 className="h-12 w-12 mx-auto text-primary mb-4" />
                                <p className="font-medium">Capture d'écran: Interface d'édition de la structure du livre</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Onglet ÉDITION */}
            <TabsContent value="edition">
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit3 className="h-5 w-5 text-primary" />
                      Éditer et mettre en forme votre contenu
                    </CardTitle>
                    <CardDescription>Maîtrisez l'éditeur de texte et ses fonctionnalités</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted p-4 border-b">
                          <h3 className="font-semibold">Utiliser la barre d'outils de formatage</h3>
                        </div>
                        <div className="p-6 space-y-4">
                          <p>
                            L'éditeur de texte de Clustica - Magical dispose d'une barre d'outils complète pour mettre en forme votre contenu.
                          </p>
                          <div className="border rounded-lg p-4 bg-muted/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="font-medium">Formatage de base</div>
                                <ul className="list-disc pl-6 space-y-1">
                                  <li><strong>Gras</strong> - Met le texte en gras</li>
                                  <li><em>Italique</em> - Met le texte en italique</li>
                                  <li><u>Souligné</u> - Souligne le texte</li>
                                  <li>Barré - Barre le texte</li>
                                </ul>
                              </div>
                              <div className="space-y-2">
                                <div className="font-medium">Structures</div>
                                <ul className="list-disc pl-6 space-y-1">
                                  <li>Titres (H1, H2, H3)</li>
                                  <li>Listes à puces</li>
                                  <li>Listes numérotées</li>
                                  <li>Citations</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          <div className="relative rounded-md overflow-hidden border">
                            {/* Simulation d'image */}
                            <div className="bg-gradient-to-r from-gray-100 to-gray-200 h-64 w-full flex items-center justify-center">
                              <div className="text-center p-6 bg-white/80 rounded-lg shadow-sm">
                                <PenTool className="h-12 w-12 mx-auto text-primary mb-4" />
                                <p className="font-medium">Capture d'écran: Barre d'outils de formatage</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted p-4 border-b">
                          <h3 className="font-semibold">Astuces pour l'édition</h3>
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                  <Save className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className="font-medium">Sauvegarde automatique</h4>
                                  <p className="text-sm text-muted-foreground">Votre contenu est sauvegardé automatiquement toutes les 30 secondes.</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                  <Image className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className="font-medium">Ajout d'images</h4>
                                  <p className="text-sm text-muted-foreground">Cliquez sur l'icône d'image dans la barre d'outils pour insérer une illustration.</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                  <Share className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className="font-medium">Prévisualisation</h4>
                                  <p className="text-sm text-muted-foreground">Utilisez l'onglet "Aperçu" pour voir comment votre livre apparaîtra.</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                  <Brain className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className="font-medium">Aide contextuelle</h4>
                                  <p className="text-sm text-muted-foreground">Sélectionnez du texte et cliquez sur "Améliorer" pour des suggestions d'IA.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Onglet IA */}
            <TabsContent value="ai">
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      Utiliser l'assistance IA
                    </CardTitle>
                    <CardDescription>Générer du contenu et obtenir de l'aide grâce à l'intelligence artificielle</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted p-4 border-b">
                          <h3 className="font-semibold">Créer un livre avec l'IA</h3>
                        </div>
                        <div className="p-6 space-y-4">
                          <p>
                            Clustica - Magical vous permet de générer un livre complet en utilisant l'intelligence artificielle.
                          </p>
                          <div className="border rounded-lg p-4 bg-muted/30">
                            <div className="space-y-3">
                              <div className="flex gap-2 items-center text-primary">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">1</div>
                                <span>Depuis votre tableau de bord, cliquez sur <strong>"+ Nouveau livre IA"</strong>.</span>
                              </div>
                              <div className="flex gap-2 items-center text-primary">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">2</div>
                                <span>Décrivez l'histoire que vous souhaitez créer dans le champ <strong>"Prompt"</strong>.</span>
                              </div>
                              <div className="flex gap-2 items-center text-primary">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">3</div>
                                <span>Configurez les options supplémentaires : genre, style, personnages, etc.</span>
                              </div>
                              <div className="flex gap-2 items-center text-primary">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">4</div>
                                <span>Cliquez sur <strong>"Générer"</strong> et attendez que l'IA crée votre livre.</span>
                              </div>
                            </div>
                          </div>
                          <div className="relative rounded-md overflow-hidden border">
                            {/* Simulation d'image */}
                            <div className="bg-gradient-to-r from-gray-100 to-gray-200 h-64 w-full flex items-center justify-center">
                              <div className="text-center p-6 bg-white/80 rounded-lg shadow-sm">
                                <Brain className="h-12 w-12 mx-auto text-primary mb-4" />
                                <p className="font-medium">Capture d'écran: Interface de génération de livre par IA</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted p-4 border-b">
                          <h3 className="font-semibold">Conseils pour de meilleurs résultats avec l'IA</h3>
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border rounded-lg p-4 bg-primary/5">
                              <h4 className="font-medium text-primary mb-2">À faire</h4>
                              <ul className="list-disc pl-5 space-y-2">
                                <li>Soyez spécifique dans vos descriptions</li>
                                <li>Précisez le genre, le ton et l'ambiance souhaités</li>
                                <li>Donnez des détails sur les personnages principaux</li>
                                <li>Indiquez le public cible (enfants, adultes, etc.)</li>
                                <li>Mentionnez des éléments de l'intrigue souhaités</li>
                              </ul>
                            </div>
                            <div className="border rounded-lg p-4 bg-gray-50">
                              <h4 className="font-medium text-gray-500 mb-2">À éviter</h4>
                              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                                <li>Des prompts trop vagues ou trop courts</li>
                                <li>Des demandes contradictoires</li>
                                <li>Demander du contenu inapproprié</li>
                                <li>Utiliser des références obscures sans explication</li>
                                <li>S'attendre à un résultat parfait du premier coup</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Onglet EXPORT */}
            <TabsContent value="export">
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-primary" />
                      Exporter votre livre
                    </CardTitle>
                    <CardDescription>Partager et distribuer vos créations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted p-4 border-b">
                          <h3 className="font-semibold">Exporter au format EPUB</h3>
                        </div>
                        <div className="p-6 space-y-4">
                          <p>
                            Le format EPUB est le standard pour les livres électroniques, compatible avec la plupart des liseuses et applications de lecture.
                          </p>
                          <div className="border rounded-lg p-4 bg-muted/30">
                            <div className="space-y-3">
                              <div className="flex gap-2 items-center text-primary">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">1</div>
                                <span>Ouvrez le livre que vous souhaitez exporter.</span>
                              </div>
                              <div className="flex gap-2 items-center text-primary">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">2</div>
                                <span>Cliquez sur le bouton <strong>"Exporter"</strong> dans la barre d'outils supérieure.</span>
                              </div>
                              <div className="flex gap-2 items-center text-primary">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">3</div>
                                <span>Sélectionnez <strong>"EPUB"</strong> comme format d'export.</span>
                              </div>
                              <div className="flex gap-2 items-center text-primary">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">4</div>
                                <span>Configurez les options d'export (couverture, métadonnées, etc.).</span>
                              </div>
                              <div className="flex gap-2 items-center text-primary">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">5</div>
                                <span>Cliquez sur <strong>"Télécharger"</strong> pour obtenir votre fichier EPUB.</span>
                              </div>
                            </div>
                          </div>
                          <div className="relative rounded-md overflow-hidden border">
                            {/* Simulation d'image */}
                            <div className="bg-gradient-to-r from-gray-100 to-gray-200 h-64 w-full flex items-center justify-center">
                              <div className="text-center p-6 bg-white/80 rounded-lg shadow-sm">
                                <Download className="h-12 w-12 mx-auto text-primary mb-4" />
                                <p className="font-medium">Capture d'écran: Interface d'exportation EPUB</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted p-4 border-b">
                          <h3 className="font-semibold">Créer une couverture attrayante</h3>
                        </div>
                        <div className="p-6 space-y-4">
                          <p>
                            Une belle couverture est essentielle pour donner envie aux lecteurs de découvrir votre livre.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border rounded-lg p-4 bg-primary/5">
                              <h4 className="font-medium text-primary mb-2">Conseils pour une bonne couverture</h4>
                              <ul className="list-disc pl-5 space-y-2">
                                <li>Optez pour des images de haute qualité</li>
                                <li>Choisissez une police lisible pour le titre</li>
                                <li>Veillez au contraste entre le texte et l'arrière-plan</li>
                                <li>Utilisez une palette de couleurs harmonieuse</li>
                                <li>Gardez un design simple et impactant</li>
                              </ul>
                            </div>
                            <div className="relative rounded-md overflow-hidden border h-[200px]">
                              {/* Simulation d'image */}
                              <div className="bg-gradient-to-r from-purple-100 to-blue-100 h-full w-full flex items-center justify-center">
                                <div className="text-center p-4 bg-white/80 rounded-lg shadow-sm">
                                  <Image className="h-10 w-10 mx-auto text-primary mb-2" />
                                  <p className="font-medium text-sm">Exemple de couverture</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <footer className="bg-muted py-6 mt-10">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Clustica - Magical &copy; {new Date().getFullYear()} - Tous droits réservés
          </p>
        </div>
      </footer>
    </div>
  );
}