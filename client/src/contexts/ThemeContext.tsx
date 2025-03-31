import React, { createContext, useState, useContext, useEffect } from 'react';

// Type de thème supporté
type Theme = 'light' | 'dark';

// Interface pour le contexte de thème
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  themeLoaded: boolean;
}

// Création du contexte avec une valeur par défaut
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  themeLoaded: false,
});

// Provider pour le contexte de thème
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // État pour suivre le thème actuel
  const [theme, setThemeState] = useState<Theme>('light');
  const [themeLoaded, setThemeLoaded] = useState(false);

  // Chargement initial du thème depuis le fichier theme.json
  const fetchThemeFromServer = async () => {
    try {
      // Récupérer le thème depuis le fichier theme.json via une API
      const response = await fetch('/api/theme', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const appearance = data.theme?.appearance || 'light';
        console.log("Thème récupéré du serveur:", appearance);
        
        // Mettre à jour le state et le localStorage
        setThemeState(appearance as Theme);
        localStorage.setItem('theme', appearance);
        
        // Appliquer le thème au document
        applyTheme(appearance as Theme);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du thème:', error);
      // En cas d'erreur, récupérer depuis localStorage ou utiliser le mode du système
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      
      if (savedTheme) {
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const systemTheme = prefersDark ? 'dark' : 'light';
        setThemeState(systemTheme);
        localStorage.setItem('theme', systemTheme);
        applyTheme(systemTheme);
      }
    } finally {
      setThemeLoaded(true);
    }
  };

  // Fonction pour appliquer le thème au document
  const applyTheme = (newTheme: Theme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
      document.body.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
      document.body.classList.remove('dark-theme');
    }
  };

  // Fonction pour mettre à jour le thème dans le state, localStorage, et sur le serveur
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
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
      const response = await fetch('/api/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appearance: newTheme,
          // Couleur primaire pour le thème
          primary: newTheme === 'dark' ? 'hsl(260 60% 60%)' : 'hsl(222.2 47.4% 11.2%)',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du thème');
      }
      
      console.log("Thème mis à jour avec succès:", newTheme);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du thème:', error);
    }
  };

  // Effet pour initialiser le thème depuis le serveur ou localStorage
  useEffect(() => {
    fetchThemeFromServer();
  }, []);

  // Effet pour apliquer le thème quand il change
  useEffect(() => {
    if (themeLoaded) {
      applyTheme(theme);
    }
  }, [theme, themeLoaded]);

  // Valeur exposée par le contexte
  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    themeLoaded
  };

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