import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialisation du thème le plus tôt possible pour éviter les flashs
(function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    // Appliquer le thème sombre sur toute la hiérarchie du document
    document.documentElement.classList.add('dark-theme');
    document.body.classList.add('dark-theme');
    document.documentElement.setAttribute('data-theme', 'dark');
    
    // Ajouter un gestionnaire de mutation pour s'assurer que les éléments dynamiquement ajoutés respectent le thème
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const element = node as HTMLElement;
              element.classList.add('dark-theme');
              
              // Appliquer aux enfants également
              element.querySelectorAll('*').forEach(child => {
                if (child instanceof HTMLElement) {
                  child.classList.add('dark-theme');
                }
              });
            }
          });
        }
      });
    });
    
    // Observer les changements dans le body
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    // Stocker l'observer dans window pour pouvoir y accéder plus tard
    (window as any).__themeObserver = observer;
  } else {
    document.documentElement.classList.remove('dark-theme');
    document.body.classList.remove('dark-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    
    // Déconnecter l'observer s'il existe
    if ((window as any).__themeObserver) {
      (window as any).__themeObserver.disconnect();
    }
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
