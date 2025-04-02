import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, BookOpen, Sparkles, Cloud, Book, Feather, Star } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';

export default function Landing() {
  const [_, navigate] = useLocation();
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Helmet>
        <title>Clustica - Magical | Créateur de Livres Virtuels</title>
      </Helmet>
      
      {/* Header Navigation */}
      <header className="bg-background sticky top-0 z-10 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between py-4">
          <div className="flex items-center">
            <Link href="/">
              <span className="flex items-center gap-2 font-semibold text-xl cursor-pointer">
                <span className="text-primary font-bold">Clustica - Magical</span>
              </span>
            </Link>
            <nav className="hidden md:flex gap-6 ml-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Fonctionnalités
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Tarifs
              </a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                Témoignages
              </a>
            </nav>
          </div>
          <div className="flex gap-2">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-green-600 font-medium">Vous êtes connecté !</div>
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-primary hover:bg-primary/90"
                >
                  Accéder à votre espace
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  onClick={() => navigate('/login')} 
                  variant="outline"
                >
                  Connexion
                </Button>
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-primary hover:bg-primary/90"
                >
                  S'inscrire
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/90 to-primary/70 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 mb-10 lg:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Créez des livres professionnels en toute simplicité
            </h1>
            <p className="text-xl mb-8 text-white/80">
              Avec Clustica - Magical, transformez vos idées en œuvres littéraires de qualité, 
              qu'il s'agisse de romans, manuels, portfolios ou livres pour enfants.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              {currentUser ? (
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  className="bg-white text-primary hover:bg-white/90 py-2 px-4"
                >
                  Accéder à mon espace <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={() => navigate('/register')} 
                    className="bg-white text-primary hover:bg-white/90 py-2 px-4"
                  >
                    Commencer gratuitement <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    onClick={() => navigate('/login')} 
                    variant="outline"
                    className="bg-transparent border-white text-white hover:bg-white hover:text-primary py-2 px-4"
                  >
                    Se connecter
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="lg:w-1/2 flex justify-center">
            <div className="relative">
              <div className="w-80 h-96 rounded-lg bg-white/10 backdrop-blur-sm shadow-xl transform rotate-3 absolute"></div>
              <div className="w-80 h-96 rounded-lg bg-white/20 shadow-xl relative z-10 -rotate-3">
                <div className="p-8 flex flex-col h-full justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-4">Le Mystère des Étoiles</h3>
                    <p className="text-sm text-white/80">Un voyage à travers les étoiles, où chaque page révèle un nouveau mystère de l'univers. Une aventure captivante écrite avec Clustica - Magical.</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>Par Marie Laurent</p>
                    <p>Édité avec Clustica - Magical</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-primary/90 py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-xl font-medium mb-2">Version Pré-Bêta</div>
                <div className="text-white/80">En développement actif</div>
              </div>
              <div>
                <div className="text-xl font-medium mb-2">Facile à utiliser</div>
                <div className="text-white/80">Interface intuitive</div>
              </div>
              <div>
                <div className="text-xl font-medium mb-2">Formats de base</div>
                <div className="text-white/80">EPUB et HTML</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fonctionnalités de la pré-bêta</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez les fonctionnalités disponibles dans cette version préliminaire de Clustica - Magical.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-primary mb-4">
                <Feather className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Éditeur Simple</h3>
              <p className="text-gray-600">
                Un éditeur basique mais fonctionnel pour créer et organiser le contenu de vos livres par chapitres et pages.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-primary mb-4">
                <Sparkles className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Assistance IA (Bêta)</h3>
              <p className="text-gray-600">
                Testez notre générateur de livres par IA en développement. Fonctionnalité expérimentale avec Mistral AI.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-primary mb-4">
                <Cloud className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Synchronisation Cloud</h3>
              <p className="text-gray-600">
                Sauvegardez vos projets dans le Cloud pour les protéger et y accéder depuis n'importe quel appareil.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-primary mb-4">
                <Book className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Export EPUB</h3>
              <p className="text-gray-600">
                Exportez vos livres au format EPUB, compatible avec la plupart des liseuses numériques et applications de lecture.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-primary mb-4">
                <BookOpen className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Structure Basique</h3>
              <p className="text-gray-600">
                Organisez votre livre avec une structure simple comprenant chapitres et pages, avec possibilité de prévisualisation.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-dashed border-primary/30">
              <div className="text-gray-400 mb-4">
                <Star className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-500">Fonctionnalités à venir</h3>
              <p className="text-gray-500">
                De nombreuses améliorations sont prévues : modèles avancés, collaboration en temps réel, export PDF et bien plus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choisissez le plan qui vous convient</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des options simples adaptées à vos besoins pour créer des livres de qualité.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-2xl font-bold text-gray-900">Gratuit</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold">0€</span>
                  <span className="ml-1 text-gray-500">/mois</span>
                </div>
                <p className="mt-2 text-gray-500">Parfait pour essayer la plateforme</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">3 livres maximum</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">1 livre IA maximum</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">3 chapitres par livre maximum</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">3 pages par chapitre maximum</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">Exportation EPUB</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">Sauvegarde cloud basique</p>
                </div>
                <div className="flex items-center opacity-50">
                  <div className="flex-shrink-0 h-5 w-5 text-gray-300">✗</div>
                  <p className="ml-3 text-gray-400">Exportation PDF</p>
                </div>
              </div>
              <div className="p-6">
                {currentUser ? (
                  <Button 
                    onClick={() => navigate('/dashboard')} 
                    className="w-full"
                    variant="outline"
                  >
                    Accéder à mon espace
                  </Button>
                ) : (
                  <Button 
                    onClick={() => navigate('/register')} 
                    className="w-full"
                    variant="outline"
                  >
                    Commencer gratuitement
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-white border-2 border-primary rounded-lg shadow-lg transform md:scale-105 overflow-hidden">
              <div className="bg-primary px-3 py-1 text-white text-center text-sm font-medium">
                RECOMMANDÉ
              </div>
              <div className="p-6 border-b">
                <h3 className="text-2xl font-bold text-gray-900">Premium</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold">4,99€</span>
                  <span className="ml-1 text-gray-500">/mois</span>
                </div>
                <p className="mt-2 text-gray-500">Idéal pour les auteurs passionnés</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">10 livres maximum</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">Exportation EPUB</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">Sauvegarde Cloud avancée</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">5 livres IA maximum</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">6 chapitres par livre maximum</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">4 pages par chapitre maximum</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">Support prioritaire</p>
                </div>
              </div>
              <div className="p-6">
                {currentUser ? (
                  <Button 
                    onClick={() => navigate('/dashboard')} 
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Accéder à mon espace
                  </Button>
                ) : (
                  <Button 
                    onClick={() => navigate('/register')} 
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    S'abonner maintenant
                  </Button>
                )}
              </div>
            </div>


          </div>
        </div>
      </section>

      {/* À propos et Roadmap Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">À propos de la pré-bêta</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Clustica - Magical est actuellement en phase de développement actif. Voici ce que vous pouvez attendre de cette version préliminaire.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-primary mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Objectif du projet</h3>
              <p className="text-gray-700 mb-4">
                Clustica - Magical vise à offrir aux auteurs indépendants et aux créateurs de contenu un outil simple mais puissant pour créer, organiser et publier leurs œuvres littéraires.
              </p>
              <p className="text-gray-700">
                Cette version pré-bêta vous permet de tester les fonctionnalités de base et de nous aider à façonner l'avenir de l'application avec vos retours.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-primary mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">État actuel</h3>
              <p className="text-gray-700 mb-4">
                La pré-bêta inclut les fonctionnalités essentielles : création et édition de livres, organisation en chapitres, sauvegarde Cloud et export EPUB basique.
              </p>
              <p className="text-gray-700">
                Notre IA assistante est en phase expérimentale et s'améliore continuellement. L'interface utilisateur est fonctionnelle mais sera affinée avant la version finale.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-primary mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Roadmap</h3>
              <div className="space-y-3">
                <div className="flex items-baseline space-x-2">
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  <p className="text-gray-700">Editeur de base et sauvegarde</p>
                </div>
                <div className="flex items-baseline space-x-2">
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  <p className="text-gray-700">Export EPUB simple</p>
                </div>
                <div className="flex items-baseline space-x-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                  <p className="text-gray-700">Génération IA avancée</p>
                </div>
                <div className="flex items-baseline space-x-2">
                  <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                  <p className="text-gray-500">Modèles et templates</p>
                </div>
                <div className="flex items-baseline space-x-2">
                  <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                  <p className="text-gray-500">Exportation PDF & plus</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Envie de tester la version pré-bêta ?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            Participez au développement de Clustica - Magical en testant cette version préliminaire et en partageant vos retours.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            {currentUser ? (
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="bg-white text-primary hover:bg-white/90 py-3 px-6 text-lg"
              >
                Accéder à mon espace <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <>
                <Button 
                  onClick={() => navigate('/register')} 
                  className="bg-white text-primary hover:bg-white/90 py-3 px-6 text-lg"
                >
                  S'inscrire à la pré-bêta <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  onClick={() => navigate('/login')} 
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white hover:text-primary py-3 px-6 text-lg"
                >
                  Se connecter
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Clustica - Magical</h3>
              <p className="text-gray-400 mb-4">
                La plateforme de création de livres numériques et imprimés pour tous les créateurs.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Produit</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition">Fonctionnalités</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition">Tarifs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Mises à jour</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Ressources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Guides</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Support</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Communauté</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Informations légales</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Confidentialité</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Conditions d'utilisation</a></li>
                <li><a href="/legal" className="text-gray-400 hover:text-white transition">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Clustica - Magical. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}