import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import Layout from "../components/ui/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Sun, Monitor } from "lucide-react";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, userInfo, refreshUserInfo } = useAuth();
  const { toast } = useToast();
  
  // État pour suivre si les paramètres ont été enregistrés avec succès
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Réinitialiser le message de succès après 3 secondes
  useEffect(() => {
    if (savedSuccess) {
      const timer = setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [savedSuccess]);
  
  // Rafraîchir les informations de l'utilisateur à chaque affichage de la page
  useEffect(() => {
    refreshUserInfo();
  }, [refreshUserInfo]);

  // Fonction pour enregistrer les paramètres
  const saveSettings = async () => {
    try {
      // Pour l'instant, nous n'avons que le changement de thème qui est automatiquement sauvegardé
      // via le contexte de thème, donc nous montrons juste un message de succès
      setSavedSuccess(true);
      toast({
        title: "Paramètres enregistrés",
        description: "Vos préférences ont été mises à jour avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement des paramètres",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Paramètres</h1>
        
        <Tabs defaultValue="appearance">
          <TabsList className="mb-6">
            <TabsTrigger value="appearance">Apparence</TabsTrigger>
            <TabsTrigger value="account">Compte</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Thème</CardTitle>
                <CardDescription>
                  Personnalisez l'apparence de l'application selon vos préférences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-full bg-primary/10">
                      {theme === 'dark' ? (
                        <Moon className="h-5 w-5 text-primary" />
                      ) : (
                        <Sun className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">Mode {theme === 'dark' ? 'sombre' : 'clair'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {theme === 'dark' 
                          ? 'Interface avec couleurs sombres, idéal pour une utilisation nocturne' 
                          : 'Interface avec couleurs claires, pour une meilleure lisibilité de jour'}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveSettings} className="ml-auto">
                  {savedSuccess ? 'Paramètres enregistrés!' : 'Enregistrer les paramètres'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Informations du compte</CardTitle>
                <CardDescription>
                  Vos informations personnelles et détails du plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentUser && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Email</Label>
                        <p className="text-sm mt-1">{currentUser.email}</p>
                      </div>
                      <div>
                        <Label>Nom d'utilisateur</Label>
                        <p className="text-sm mt-1">{userInfo?.displayName || 'Non défini'}</p>
                      </div>
                      <div>
                        <Label>Plan</Label>
                        <p className="text-sm mt-1 flex items-center">
                          {userInfo?.plan === 'premium' ? (
                            <>
                              <span className="text-amber-500 font-semibold">Premium</span>
                            </>
                          ) : (
                            <span>Gratuit</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <Label>Utilisation</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="p-3 rounded-lg bg-primary/5">
                          <p className="text-sm text-muted-foreground">Livres créés</p>
                          <p className="font-medium mt-1">
                            {userInfo?.booksCreated || 0} / {userInfo?.plan === 'premium' ? 'Illimité' : '3'}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-primary/5">
                          <p className="text-sm text-muted-foreground">Livres IA créés</p>
                          <p className="font-medium mt-1">
                            {userInfo?.aiBooksCreated || 0} / {userInfo?.plan === 'premium' ? 'Illimité' : '1'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              {userInfo?.plan !== 'premium' && (
                <CardFooter>
                  <Button variant="outline" className="ml-auto">
                    Passer au plan premium
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}