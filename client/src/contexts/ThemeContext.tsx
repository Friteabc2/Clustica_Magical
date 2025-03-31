import React, { createContext, useState, useContext, useEffect } from 'react';

// Type de thème supporté
type Theme = 'light' | 'dark';

// Interface pour le contexte de thème
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Création du contexte avec une valeur par défaut
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

// Provider pour le contexte de thème
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // État pour suivre le thème actuel
  const [theme, setThemeState] = useState<Theme>('light');
  const [loading, setLoading] = useState(true);

  // Fonction pour mettre à jour le thème dans le state et le localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeJson(newTheme);
  };

  // Fonction pour basculer entre les thèmes
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Mise à jour du fichier theme.json via l'API
  const updateThemeJson = async (newTheme: Theme) => {
    try {
      await fetch('/api/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appearance: newTheme,
          // Couleur primaire pour un thème sombre (violet)
          primary: newTheme === 'dark' ? 'hsl(260 60% 60%)' : 'hsl(222.2 47.4% 11.2%)',
        }),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du thème:', error);
    }
  };

  // Effet pour initialiser le thème depuis localStorage ou préférence du système
  useEffect(() => {
    // Récupérer le thème depuis localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    
    if (savedTheme) {
      // Si un thème est déjà sauvegardé, l'utiliser
      setThemeState(savedTheme);
    } else {
      // Sinon, vérifier la préférence du système
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(prefersDark ? 'dark' : 'light');
    }
    
    setLoading(false);
  }, []);

  // Valeur exposée par le contexte
  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
  };

  // Ne pas rendre les enfants tant que le thème n'est pas chargé
  if (loading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook personnalisé pour utiliser le contexte de thème
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}