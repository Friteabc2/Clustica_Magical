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

export default function BetaWarningToast() {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    // Vérifier si l'avertissement a déjà été affiché dans cette session
    const hasBeenShown = sessionStorage.getItem('betaWarningShown');
    
    if (!hasBeenShown) {
      // Afficher après un court délai pour ne pas bloquer le chargement initial
      const timer = setTimeout(() => {
        setIsOpen(true);
        // Marquer comme affiché pour cette session
        sessionStorage.setItem('betaWarningShown', 'true');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
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