import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { Helmet } from 'react-helmet';

export default function Privacy() {
  const [_, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Politique de Confidentialité | Clustica - Magical</title>
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
          
          <Card>
            <CardContent className="pt-6">
              <h1 className="text-3xl font-bold text-center mb-8">Politique de Confidentialité</h1>
              
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-bold mb-4">1. Introduction</h2>
                  <p>
                    Chez Clustica - Magical, je m'engage à protéger votre vie privée. Cette politique de confidentialité explique 
                    comment vos données personnelles sont collectées, utilisées et protégées lorsque vous utilisez mon application.
                  </p>
                  <p className="mt-2">
                    En utilisant Clustica - Magical, vous acceptez les pratiques décrites dans la présente politique.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">2. Données collectées</h2>
                  <p>
                    Je collecte les informations suivantes :
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Informations que vous fournissez lors de la création de votre compte (adresse email, nom d'utilisateur)</li>
                    <li>Contenu que vous créez sur la plateforme (livres, histoires, chapitres)</li>
                    <li>Informations techniques sur votre appareil et votre connexion</li>
                    <li>Cookies et technologies similaires pour améliorer votre expérience</li>
                  </ul>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">3. Utilisation des données</h2>
                  <p>
                    J'utilise vos informations personnelles pour :
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Fournir, maintenir et améliorer les services Clustica - Magical</li>
                    <li>Traiter les transactions et gérer votre compte</li>
                    <li>Vous envoyer des notifications importantes concernant votre compte ou le service</li>
                    <li>Personnaliser votre expérience utilisateur</li>
                    <li>Diagnostiquer les problèmes techniques et améliorer la sécurité</li>
                  </ul>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">4. Partage des données</h2>
                  <p>
                    Je ne vends pas vos données personnelles à des tiers. Je peux cependant partager certaines informations dans les cas suivants :
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Avec des prestataires de services qui m'aident à fournir mes services (hébergement, stockage, paiement)</li>
                    <li>Si la loi l'exige ou pour protéger mes droits</li>
                    <li>En cas de fusion, vente ou transfert d'actifs (avec votre consentement si requis par la loi)</li>
                  </ul>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">5. Stockage et sécurité</h2>
                  <p>
                    Vos données sont stockées sur des serveurs sécurisés et je mets en œuvre des mesures de sécurité appropriées 
                    pour protéger vos informations personnelles contre la perte, l'accès non autorisé, la divulgation ou la modification.
                  </p>
                  <p className="mt-2">
                    Les données des livres et contenu sont stockées sur Dropbox, qui propose également ses propres mesures de sécurité.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">6. Vos droits</h2>
                  <p>
                    Conformément au RGPD et aux lois applicables sur la protection des données, vous disposez des droits suivants :
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Droit d'accès à vos données personnelles</li>
                    <li>Droit de rectification des données inexactes</li>
                    <li>Droit à l'effacement (droit à l'oubli)</li>
                    <li>Droit à la limitation du traitement</li>
                    <li>Droit à la portabilité des données</li>
                    <li>Droit d'opposition au traitement</li>
                  </ul>
                  <p className="mt-2">
                    Pour exercer ces droits, veuillez me contacter à l'adresse email suivante : clustica.x@gmail.com
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">7. Cookies</h2>
                  <p>
                    Clustica - Magical utilise des cookies et technologies similaires pour améliorer votre expérience 
                    sur notre site. Ces technologies nous permettent de mémoriser vos préférences et de comprendre comment 
                    vous utilisez notre service.
                  </p>
                  <p className="mt-2">
                    Vous pouvez configurer votre navigateur pour refuser tous les cookies ou pour indiquer quand un cookie est envoyé. 
                    Cependant, certaines fonctionnalités du site pourraient ne pas fonctionner correctement sans cookies.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">8. Modifications de cette politique</h2>
                  <p>
                    Je me réserve le droit de modifier cette politique de confidentialité à tout moment. 
                    Les modifications seront publiées sur cette page avec une date de mise à jour révisée.
                  </p>
                  <p className="mt-2">
                    Je vous encourage à consulter régulièrement cette politique pour rester informé de la manière dont je protège vos informations.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">9. Contact</h2>
                  <p>
                    Si vous avez des questions concernant cette politique de confidentialité ou la façon dont je traite vos données personnelles, 
                    veuillez me contacter à l'adresse suivante : clustica.x@gmail.com
                  </p>
                </section>
              </div>
              
              <div className="mt-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Dernière mise à jour : 2 avril 2025
                </p>
              </div>
            </CardContent>
          </Card>
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