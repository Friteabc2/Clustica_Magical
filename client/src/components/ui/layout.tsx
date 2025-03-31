import React from "react";
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
  
  // Ajouter une classe au body pour le thème
  React.useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [theme]);

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {!hideNav && <Header />}
      <main className="flex-1">
        {children}
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        <div className="container mx-auto">
          <p>© {new Date().getFullYear()} - Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
}