import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { LogOut, User, Settings, Sparkles, BookText, Bot, Database, Moon, Sun } from "lucide-react";

export default function UserMenu() {
  const { currentUser, userInfo, logout, refreshUserInfo } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Rafraîchir les informations de l'utilisateur uniquement lors de l'ouverture du menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  useEffect(() => {
    if (isMenuOpen && currentUser && userInfo) {
      refreshUserInfo();
    }
  }, [isMenuOpen, refreshUserInfo, currentUser, userInfo]);

  // Fonction de déconnexion
  async function handleLogout() {
    try {
      await logout();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur de déconnexion",
        description: "Une erreur est survenue lors de la déconnexion",
        variant: "destructive",
      });
    }
  }

  // Si aucun utilisateur n'est connecté, afficher les boutons de connexion/inscription
  if (!currentUser) {
    return (
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => navigate("/login")}
        >
          Connexion
        </Button>
        <Button 
          onClick={() => navigate("/register")}
        >
          Créer un compte
        </Button>
      </div>
    );
  }

  // Si un utilisateur est connecté, afficher le menu utilisateur
  const displayName = userInfo?.displayName || currentUser.displayName || currentUser.email;
  const initials = displayName ? displayName.substring(0, 2).toUpperCase() : "?";

  return (
    <DropdownMenu onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative rounded-full h-10 w-10 p-0">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{displayName}</span>
            <span className="text-xs text-gray-500 truncate">{currentUser.email}</span>
            <div className="mt-2 flex items-center">
              <Badge variant={userInfo?.plan === 'premium' ? "default" : "secondary"} className="flex items-center gap-1">
                {userInfo?.plan === 'premium' ? (
                  <>
                    <Sparkles className="h-3 w-3" />
                    Premium
                  </>
                ) : (
                  <>
                    Plan Gratuit
                  </>
                )}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Usage Stats */}
        <div className="px-2 py-1.5 text-xs">
          <div className="flex justify-between mb-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <BookText className="h-3 w-3" />
              Livres créés
            </div>
            <span>
              {userInfo?.booksCreated || 0} / {userInfo?.plan === 'premium' ? '10' : '3'}
            </span>
          </div>
          <div className="flex justify-between">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Bot className="h-3 w-3" />
              Livres IA
            </div>
            <span>
              {userInfo?.aiBooksCreated || 0} / {userInfo?.plan === 'premium' ? '5' : '1'}
            </span>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <BookText className="mr-2 h-4 w-4" />
          <span>Mes Livres</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => navigate("/profile")}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profil</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => navigate("/settings")}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Paramètres</span>
        </DropdownMenuItem>
        {/* Admin option is removed/disabled */}
        <DropdownMenuSeparator />
        {/* Option de thème */}
        <div className="px-2 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span>Mode {theme === 'dark' ? 'sombre' : 'clair'}</span>
          </div>
          <Switch 
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
          />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-red-500 focus:text-red-500" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}