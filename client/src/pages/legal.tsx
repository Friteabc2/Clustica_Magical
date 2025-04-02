import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { Helmet } from 'react-helmet';

export default function Legal() {
  const [_, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Mentions légales | Clustica - Magical</title>
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
              <h1 className="text-3xl font-bold text-center mb-8">Mentions Légales</h1>
              
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-bold mb-4">1. Informations sur l'éditeur</h2>
                  <p>
                    Clustica - Magical est un service édité par la société Clustica SAS, une société par actions simplifiée au capital de 10 000 €,
                    immatriculée au Registre du Commerce et des Sociétés sous le numéro RCS Paris 123 456 789.
                  </p>
                  <p className="mt-2">
                    <strong>Siège social :</strong> 42 Avenue de la République, 75011 Paris, France
                  </p>
                  <p className="mt-2">
                    <strong>Numéro de TVA intracommunautaire :</strong> FR 12 345 678 901
                  </p>
                  <p className="mt-2">
                    <strong>Directeur de la publication :</strong> Jean Dupont, Président
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">2. Hébergement</h2>
                  <p>
                    Le site est hébergé par Replit, Inc., une société américaine.
                  </p>
                  <p className="mt-2">
                    <strong>Adresse :</strong> 3130 20th Street, Suite 300, San Francisco, CA 94110, USA
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">3. Propriété intellectuelle</h2>
                  <p>
                    L'ensemble des éléments composant le site Clustica - Magical (textes, graphismes, logiciels, photographies, images, vidéos, sons, plans, logos, marques, etc.) 
                    ainsi que le site lui-même, sont la propriété exclusive de Clustica SAS ou de ses partenaires.
                  </p>
                  <p className="mt-2">
                    Toute représentation totale ou partielle de ce site par quelque procédé que ce soit, sans l'autorisation expresse de Clustica SAS, 
                    est interdite et constituerait une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">4. Protection des données personnelles</h2>
                  <p>
                    Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, 
                    vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données personnelles, 
                    ainsi que d'un droit d'opposition et de limitation du traitement vous concernant.
                  </p>
                  <p className="mt-2">
                    Pour exercer ces droits ou pour toute question sur le traitement de vos données, vous pouvez contacter notre 
                    Délégué à la Protection des Données (DPO) par email à l'adresse : privacy@clustica.com
                  </p>
                  <p className="mt-2">
                    Pour plus d'informations, veuillez consulter notre Politique de Confidentialité accessible depuis notre site web.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">5. Cookies</h2>
                  <p>
                    Le site Clustica - Magical utilise des cookies pour améliorer l'expérience utilisateur. 
                    Les cookies sont de petits fichiers stockés sur votre ordinateur qui nous aident à améliorer la qualité de votre visite 
                    sur notre site en nous permettant de mémoriser vos préférences.
                  </p>
                  <p className="mt-2">
                    Vous pouvez à tout moment désactiver l'utilisation de cookies en sélectionnant les paramètres appropriés de votre navigateur, 
                    mais cela peut empêcher l'utilisation de toutes les fonctionnalités de ce site.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">6. Limitation de responsabilité</h2>
                  <p>
                    Clustica - Magical est actuellement en phase de développement pré-bêta. 
                    Bien que nous nous efforcions de fournir un service de qualité, le site peut présenter des bugs, des erreurs ou des interruptions temporaires.
                  </p>
                  <p className="mt-2">
                    Les informations contenues sur le site sont aussi précises que possible, mais peuvent contenir des inexactitudes ou des omissions. 
                    Elles sont fournies à titre indicatif et sont susceptibles d'évoluer.
                  </p>
                  <p className="mt-2">
                    Clustica SAS ne pourra être tenue responsable des dommages directs ou indirects résultant de l'utilisation du site.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">7. Loi applicable et juridiction</h2>
                  <p>
                    Les présentes mentions légales sont soumises au droit français. 
                    En cas de litige, les tribunaux français seront compétents.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">8. Contact</h2>
                  <p>
                    Pour toute question relative à nos services ou pour nous signaler un problème, 
                    vous pouvez nous contacter par email à l'adresse : contact@clustica.com
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