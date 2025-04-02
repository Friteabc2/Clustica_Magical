import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Durée en minutes entre chaque affichage du message
const WARNING_INTERVAL_MINUTES = 10;

export default function BetaWarningToast() {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    // Fonction pour vérifier si le popup doit être affiché
    const checkAndShowWarning = () => {
      const lastShownTime = localStorage.getItem('betaWarningLastShown');
      const currentTime = new Date().getTime();
      
      // Si jamais affiché ou si l'intervalle est dépassé
      if (!lastShownTime || (currentTime - parseInt(lastShownTime)) > (WARNING_INTERVAL_MINUTES * 60 * 1000)) {
        // Afficher après un court délai pour ne pas bloquer le chargement initial
        setTimeout(() => {
          setIsOpen(true);
          // Enregistrer le moment d'affichage
          localStorage.setItem('betaWarningLastShown', currentTime.toString());
        }, 1500);
      }
    };
    
    // Vérifier au chargement initial
    checkAndShowWarning();
    
    // Configurer un intervalle pour vérifier régulièrement
    const intervalId = setInterval(checkAndShowWarning, WARNING_INTERVAL_MINUTES * 60 * 1000);
    
    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Version Pré-Bêta
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="mb-2">
              Ce site est actuellement en phase de développement pré-bêta. 
              Certaines fonctionnalités peuvent ne pas fonctionner correctement 
              ou être instables.
            </div>
            <div>
              Nous travaillons activement à améliorer l'expérience et 
              nous vous remercions de votre compréhension.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>J'ai compris</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}