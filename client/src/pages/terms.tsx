import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { Helmet } from 'react-helmet';

export default function Terms() {
  const [_, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Conditions d'utilisation | Clustica - Magical</title>
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
              <h1 className="text-3xl font-bold text-center mb-8">Conditions d'utilisation</h1>
              
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-bold mb-4">1. Acceptation des conditions</h2>
                  <p>
                    Bienvenue sur Clustica - Magical. En vous inscrivant et en utilisant notre service, vous acceptez d'être lié par les présentes conditions d'utilisation.
                    Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser ce service.
                  </p>
                  <p className="mt-2">
                    Ces conditions constituent un accord légal entre vous et Clustica - Magical (ci-après "le service", "je", "mon" ou "me").
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">2. Description du service</h2>
                  <p>
                    Clustica - Magical est une application en ligne permettant aux utilisateurs de créer, éditer et gérer des livres et histoires numériques.
                    Le service propose différentes fonctionnalités accessibles selon le plan souscrit (gratuit ou premium).
                  </p>
                  <p className="mt-2">
                    Le service est actuellement en phase de développement pré-bêta, ce qui signifie qu'il peut présenter des bugs, 
                    être sujet à des interruptions et que des fonctionnalités peuvent être modifiées, ajoutées ou supprimées sans préavis.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">3. Comptes utilisateurs</h2>
                  <p>
                    Pour utiliser Clustica - Magical, vous devez créer un compte en fournissant des informations exactes et complètes.
                    Vous êtes responsable du maintien de la confidentialité de votre mot de passe et de toutes les activités qui se produisent sous votre compte.
                  </p>
                  <p className="mt-2">
                    Vous acceptez de me notifier immédiatement de toute utilisation non autorisée de votre compte ou de toute autre violation de la sécurité.
                    Je ne serai pas responsable des pertes ou dommages résultant de votre non-respect de cette obligation.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">4. Plans et abonnements</h2>
                  <p>
                    Clustica - Magical propose deux niveaux de service :
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>Plan gratuit</strong> : Limité à 3 livres, 1 livre IA, 3 chapitres par livre et 3 pages par chapitre</li>
                    <li><strong>Plan premium</strong> : Accès à 10 livres, 5 livres IA, 6 chapitres par livre et 4 pages par chapitre, ainsi qu'à des fonctionnalités exclusives</li>
                  </ul>
                  <p className="mt-2">
                    Les abonnements premium sont facturés mensuellement à 4,99€ et se renouvellent automatiquement jusqu'à résiliation.
                    Vous pouvez annuler votre abonnement à tout moment, et vous continuerez à avoir accès au service premium jusqu'à la fin de la période de facturation en cours.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">5. Contenu utilisateur</h2>
                  <p>
                    Vous conservez tous les droits de propriété sur le contenu que vous créez à l'aide de Clustica - Magical.
                    En soumettant du contenu sur la plateforme, vous accordez une licence mondiale, non exclusive, libre de redevance pour utiliser, 
                    stocker et traiter ce contenu uniquement dans le but de vous fournir le service.
                  </p>
                  <p className="mt-2">
                    Vous êtes seul responsable du contenu que vous créez et vous garantissez que :
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Vous possédez ou avez les droits nécessaires sur tout le contenu que vous soumettez</li>
                    <li>Le contenu ne viole pas les droits de tiers, y compris les droits d'auteur, marques, vie privée ou autres droits personnels ou de propriété</li>
                    <li>Le contenu n'est pas illégal, obscène, diffamatoire, menaçant, harcelant, abusif, ou contraire aux présentes conditions</li>
                  </ul>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">6. Utilisation de l'IA</h2>
                  <p>
                    Clustica - Magical utilise des technologies d'intelligence artificielle pour générer du contenu. 
                    Le contenu généré par IA est fourni "tel quel" et je ne garantis pas son exactitude, son originalité ou sa pertinence.
                  </p>
                  <p className="mt-2">
                    Vous êtes seul responsable de la vérification et de la modification du contenu généré par IA avant son utilisation ou sa publication.
                    Je ne pourrai être tenu responsable de tout contenu généré par IA qui pourrait être considéré comme inapproprié, inexact ou en violation des droits de tiers.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">7. Limitation de responsabilité</h2>
                  <p>
                    Dans toute la mesure permise par la loi applicable, je décline toute garantie, expresse ou implicite, 
                    concernant le service, y compris, mais sans s'y limiter, les garanties de qualité marchande, d'adéquation à un usage particulier et de non-violation.
                  </p>
                  <p className="mt-2">
                    Je ne garantis pas que le service sera ininterrompu, exempt d'erreurs ou de virus, ou que les défauts seront corrigés.
                    Je ne serai pas responsable des dommages indirects, spéciaux, consécutifs ou punitifs résultant de l'utilisation ou de l'impossibilité d'utiliser le service.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">8. Modifications du service et des conditions</h2>
                  <p>
                    Je me réserve le droit de modifier ou d'interrompre, temporairement ou définitivement, le service ou une partie de celui-ci, avec ou sans préavis.
                    Je ne serai pas responsable envers vous ou un tiers pour toute modification, suspension ou interruption du service.
                  </p>
                  <p className="mt-2">
                    Je me réserve également le droit de modifier ces conditions d'utilisation à tout moment. Les modifications prendront effet dès leur publication.
                    Votre utilisation continue du service après la publication des modifications constituera votre acceptation de ces modifications.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">9. Résiliation</h2>
                  <p>
                    Je me réserve le droit de résilier ou de suspendre votre compte et l'accès au service immédiatement, sans préavis ni responsabilité, 
                    pour toute raison, y compris, sans limitation, si vous violez ces conditions d'utilisation.
                  </p>
                  <p className="mt-2">
                    En cas de résiliation, votre droit d'utiliser le service cessera immédiatement. Si vous souhaitez résilier votre compte, 
                    vous pouvez simplement cesser d'utiliser le service ou me contacter pour demander la suppression de votre compte.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">10. Loi applicable</h2>
                  <p>
                    Ces conditions d'utilisation sont régies et interprétées conformément aux lois françaises, sans égard aux principes de conflits de lois.
                    Tout litige relatif à ces conditions ou au service sera soumis à la compétence exclusive des tribunaux français.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-4">11. Contact</h2>
                  <p>
                    Si vous avez des questions concernant ces conditions d'utilisation, veuillez me contacter à l'adresse suivante : clustica.x@gmail.com
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