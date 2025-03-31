import React, { useRef, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { useTheme } from "@/contexts/ThemeContext";

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

export default function Layout({ children, hideNav = false }: LayoutProps) {
  const { theme } = useTheme();
  const [location] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Application profonde du thème à tous les éléments du layout
  useEffect(() => {
    const applyThemeToChildren = (element: HTMLElement, theme: string) => {
      // Appliquer aux enfants
      element.querySelectorAll('*').forEach(child => {
        if (child instanceof HTMLElement) {
          if (theme === 'dark') {
            child.classList.add('dark-theme');
          } else {
            child.classList.remove('dark-theme');
          }
        }
      });
    };
    
    if (containerRef.current) {
      // Appliquer le thème au conteneur principal
      if (theme === 'dark') {
        containerRef.current.classList.add('dark-theme');
      } else {
        containerRef.current.classList.remove('dark-theme');
      }
      
      // Appliquer le thème à tous les enfants
      applyThemeToChildren(containerRef.current, theme);
      
      // Observer les changements dans le DOM pour maintenir le thème
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) { // Element node
                const element = node as HTMLElement;
                if (theme === 'dark') {
                  element.classList.add('dark-theme');
                  applyThemeToChildren(element, 'dark');
                } else {
                  element.classList.remove('dark-theme');
                  applyThemeToChildren(element, 'light');
                }
              }
            });
          }
        });
      });
      
      // Observer les changements dans le conteneur principal
      observer.observe(containerRef.current, { 
        childList: true, 
        subtree: true 
      });
      
      return () => {
        observer.disconnect();
      };
    }
  }, [theme]);

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen flex flex-col ${theme === 'dark' ? 'dark-theme' : ''}`}
      data-theme={theme}
    >
      {!hideNav && <Header />}
      <main className="flex-1 bg-background dark-theme:bg-background">
        {children}
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t bg-background dark-theme:bg-background">
        <div className="container mx-auto">
          <p>© {new Date().getFullYear()} - Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
}