import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronRight, BookOpen, Sparkles, Cloud, Book, Feather, Star } from 'lucide-react';

export default function Landing() {
  const [_, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold">ClusterBook</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="hover:text-blue-200 transition">Fonctionnalités</a>
              <a href="#pricing" className="hover:text-blue-200 transition">Tarifs</a>
              <a href="#testimonials" className="hover:text-blue-200 transition">Témoignages</a>
            </div>
            <div>
              <Button 
                onClick={() => navigate('/login')} 
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-indigo-700 mr-2"
              >
                Connexion
              </Button>
              <Button 
                onClick={() => navigate('/register')} 
                className="bg-white text-indigo-700 hover:bg-blue-100"
              >
                S'inscrire
              </Button>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 mb-10 lg:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Créez des livres professionnels en toute simplicité
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Avec ClusterBook, transformez vos idées en œuvres littéraires de qualité, 
              qu'il s'agisse de romans, manuels, portfolios ou livres pour enfants.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Button 
                onClick={() => navigate('/register')} 
                className="bg-white text-indigo-700 hover:bg-blue-100 py-3 px-6 text-lg"
              >
                Commencer gratuitement <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                onClick={() => navigate('/login')} 
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-indigo-700 py-3 px-6 text-lg"
              >
                Découvrir les fonctionnalités
              </Button>
            </div>
          </div>
          <div className="lg:w-1/2 flex justify-center">
            <div className="relative">
              <div className="w-80 h-96 rounded-lg bg-white/10 backdrop-blur-sm shadow-xl transform rotate-3 absolute"></div>
              <div className="w-80 h-96 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl relative z-10 -rotate-3">
                <div className="p-8 flex flex-col h-full justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-4">Le Mystère des Étoiles</h3>
                    <p className="text-sm text-blue-100">Un voyage à travers les étoiles, où chaque page révèle un nouveau mystère de l'univers. Une aventure captivante écrite avec ClusterBook.</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>Par Marie Laurent</p>
                    <p>Édité avec ClusterBook</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-indigo-800 py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="font-bold text-3xl mb-2">10,000+</div>
                <div className="text-blue-200">Ouvrages créés</div>
              </div>
              <div>
                <div className="font-bold text-3xl mb-2">5,000+</div>
                <div className="text-blue-200">Auteurs actifs</div>
              </div>
              <div>
                <div className="font-bold text-3xl mb-2">12</div>
                <div className="text-blue-200">Formats d'exportation</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Des fonctionnalités puissantes pour vos créations</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tout ce dont vous avez besoin pour écrire, illustrer et publier vos œuvres littéraires.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-indigo-600 mb-4">
                <Feather className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Éditeur Intuitif</h3>
              <p className="text-gray-600">
                Notre éditeur WYSIWYG vous permet de créer sans effort des mises en page complexes avec une interface simple et intuitive.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-indigo-600 mb-4">
                <Sparkles className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Génération IA</h3>
              <p className="text-gray-600">
                Génération automatique de contenu avec notre IA avancée. Créez des histoires complètes à partir d'un simple prompt.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-indigo-600 mb-4">
                <Cloud className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Sauvegarde Cloud</h3>
              <p className="text-gray-600">
                Vos œuvres sont automatiquement sauvegardées dans le cloud et synchronisées avec Dropbox pour un accès partout.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-indigo-600 mb-4">
                <Book className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Formats Multiples</h3>
              <p className="text-gray-600">
                Exportez vos livres dans différents formats : EPUB, PDF, HTML et plus encore, prêts pour l'impression ou la publication numérique.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-indigo-600 mb-4">
                <BookOpen className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Modèles Professionnels</h3>
              <p className="text-gray-600">
                Des dizaines de modèles professionnels pour tous types de publications : romans, mémoires, livres pour enfants, manuels techniques...
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-indigo-600 mb-4">
                <Star className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Support Premium</h3>
              <p className="text-gray-600">
                Un support client prioritaire et des fonctionnalités exclusives pour les membres Premium. Évolution constante selon vos besoins.
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
              Des options flexibles pour tous les types d'auteurs, des débutants aux professionnels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                  <p className="ml-3 text-gray-700">2 livres maximum</p>
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
                  <p className="ml-3 text-gray-400">Génération AI</p>
                </div>
                <div className="flex items-center opacity-50">
                  <div className="flex-shrink-0 h-5 w-5 text-gray-300">✗</div>
                  <p className="ml-3 text-gray-400">Exportation PDF</p>
                </div>
              </div>
              <div className="p-6">
                <Button 
                  onClick={() => navigate('/register')} 
                  className="w-full"
                  variant="outline"
                >
                  Commencer gratuitement
                </Button>
              </div>
            </div>

            <div className="bg-white border-2 border-indigo-600 rounded-lg shadow-lg transform scale-105 overflow-hidden">
              <div className="bg-indigo-600 px-3 py-1 text-white text-center text-sm font-medium">
                RECOMMANDÉ
              </div>
              <div className="p-6 border-b">
                <h3 className="text-2xl font-bold text-gray-900">Premium</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold">9,99€</span>
                  <span className="ml-1 text-gray-500">/mois</span>
                </div>
                <p className="mt-2 text-gray-500">Idéal pour les auteurs actifs</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">Livres illimités</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">Exportation EPUB, PDF, HTML</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">Sauvegarde Cloud avancée</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">5 générations AI/mois</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">Support prioritaire</p>
                </div>
              </div>
              <div className="p-6">
                <Button 
                  onClick={() => navigate('/register')} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  S'abonner maintenant
                </Button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-2xl font-bold text-gray-900">Professionnel</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold">29,99€</span>
                  <span className="ml-1 text-gray-500">/mois</span>
                </div>
                <p className="mt-2 text-gray-500">Pour les auteurs professionnels</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">Tout dans Premium</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">Générations AI illimitées</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">Formats personnalisés</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">Collaboration en temps réel</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                  <p className="ml-3 text-gray-700">Support dédié 24/7</p>
                </div>
              </div>
              <div className="p-6">
                <Button 
                  onClick={() => navigate('/register')} 
                  className="w-full"
                  variant="outline"
                >
                  Contacter les ventes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ce que disent nos utilisateurs</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des milliers d'auteurs font confiance à ClusterBook pour leurs créations littéraires.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                "ClusterBook a transformé ma façon d'écrire. L'interface intuitive et les fonctionnalités de sauvegarde cloud m'ont permis de finaliser mon roman en moitié moins de temps."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  ML
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-bold">Marie Laurent</h4>
                  <p className="text-sm text-gray-500">Auteure de "Le Mystère des Étoiles"</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                "La génération IA est incroyable ! J'ai créé un livre pour enfants complet en quelques heures seulement, avec des illustrations et une histoire cohérente. Un outil révolutionnaire."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  PD
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-bold">Pierre Dupont</h4>
                  <p className="text-sm text-gray-500">Illustrateur et auteur jeunesse</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                "En tant qu'éditeur indépendant, ClusterBook est devenu notre outil principal pour préparer nos manuscrits. L'exportation multi-format nous fait gagner un temps précieux."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  SF
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-bold">Sophie Favreau</h4>
                  <p className="text-sm text-gray-500">Éditions Nouvelles Plumes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-700 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Prêt à concrétiser votre projet littéraire ?</h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
            Rejoignez des milliers d'auteurs qui créent des œuvres exceptionnelles avec ClusterBook.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              onClick={() => navigate('/register')} 
              className="bg-white text-indigo-700 hover:bg-indigo-100 py-3 px-6 text-lg"
            >
              Commencer gratuitement <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={() => navigate('/login')} 
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-indigo-700 py-3 px-6 text-lg"
            >
              Se connecter
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">ClusterBook</h3>
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
              <h3 className="text-white text-lg font-bold mb-4">Entreprise</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">À propos</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Équipe</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Confidentialité</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Conditions</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} ClusterBook. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}