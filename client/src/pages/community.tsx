import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, MessageSquare, Users, HelpCircle, Zap, AlertTriangle, Star } from 'lucide-react';
import { Helmet } from 'react-helmet';

export default function Community() {
  const [_, navigate] = useLocation();

  // URL fictif du serveur Discord - à remplacer par le vrai lien quand disponible
  const discordUrl = "https://discord.gg/clustica-magical";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Communauté Discord | Clustica - Magical</title>
      </Helmet>
      
      <main className="flex-1 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => navigate('/')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Rejoignez notre communauté</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connectez-vous avec d'autres créateurs, partagez vos œuvres, obtenez de l'aide et participez à l'évolution de Clustica - Magical.
            </p>
          </div>
          
          <div className="flex justify-center mb-12">
            <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white overflow-hidden w-full max-w-2xl">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="bg-white rounded-full p-4 flex-shrink-0">
                    <svg width="80" height="80" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="#5865F2"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold mb-2">Serveur Discord Clustica</h2>
                    <p className="mb-4 text-white/90">
                      Notre serveur Discord est l'endroit idéal pour interagir avec la communauté et recevoir une assistance rapide.
                    </p>
                    <Button 
                      className="bg-white text-indigo-600 hover:bg-white/90 hover:text-indigo-700"
                      size="lg"
                      onClick={() => window.open(discordUrl, '_blank')}
                    >
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Rejoindre le Discord
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <h2 className="text-2xl font-bold mb-6 text-center">Ce que vous trouverez sur notre Discord</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold mb-2">Communauté active</h3>
                  <p className="text-muted-foreground">
                    Échangez avec d'autres auteurs passionnés et partagez vos expériences créatives.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <HelpCircle className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold mb-2">Support rapide</h3>
                  <p className="text-muted-foreground">
                    Obtenez de l'aide directement auprès de la communauté ou de l'équipe de support.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold mb-2">Événements et défis</h3>
                  <p className="text-muted-foreground">
                    Participez à des concours d'écriture et des événements exclusifs pour stimuler votre créativité.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-muted rounded-lg p-6 mb-12">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold mb-2">Règles de la communauté</h3>
                <p className="mb-4">
                  Pour garantir une expérience positive pour tous, veuillez respecter ces règles simples sur notre serveur Discord :
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Soyez respectueux envers tous les membres</li>
                  <li>Ne partagez pas de contenu inapproprié ou offensant</li>
                  <li>Évitez le spam et les publicités non sollicitées</li>
                  <li>Utilisez les canaux appropriés pour vos discussions</li>
                  <li>Respectez la propriété intellectuelle d'autrui</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">Avantages pour les membres Premium</h2>
            <div className="border rounded-lg p-6 bg-gradient-to-r from-amber-50 to-yellow-50 mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Star className="h-6 w-6 text-amber-500" />
                <h3 className="font-bold text-xl">Accès exclusif</h3>
                <Star className="h-6 w-6 text-amber-500" />
              </div>
              <p className="mb-4">
                Les membres premium bénéficient d'avantages exclusifs sur notre serveur Discord :
              </p>
              <ul className="inline-block text-left list-disc space-y-1 mb-6">
                <li>Canaux de discussion exclusifs</li>
                <li>Support prioritaire et personnalisé</li>
                <li>Premiers accès aux nouvelles fonctionnalités</li>
                <li>Badges spéciaux pour votre profil</li>
              </ul>
              <div>
                <Button 
                  variant="default"
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                  onClick={() => navigate('/settings')}
                >
                  Passer au plan Premium
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground">
              Des questions ? Contactez-nous à <a href="mailto:clustica.x@gmail.com" className="text-primary underline">clustica.x@gmail.com</a>
            </p>
          </div>
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