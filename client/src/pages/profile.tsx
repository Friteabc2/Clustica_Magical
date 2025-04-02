import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/ui/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, BookText, User, UserCircle, Save, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const { currentUser, userInfo, refreshUserInfo } = useAuth();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState(userInfo?.displayName || "");
  const [bio, setBio] = useState(userInfo?.bio || "");
  const [isLoading, setIsLoading] = useState(false);

  if (!currentUser || !userInfo) {
    return (
      <Layout>
        <div className="container mx-auto py-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Profil utilisateur</h1>
          <p>Veuillez vous connecter pour accéder à votre profil.</p>
        </div>
      </Layout>
    );
  }

  const initials = displayName 
    ? displayName.substring(0, 2).toUpperCase() 
    : currentUser.email?.substring(0, 2).toUpperCase() || "U";

  // Gérer la mise à jour du profil
  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      
      // Mise à jour des informations utilisateur via l'API
      const response = await apiRequest("PUT", `/api/auth/user/${userInfo.id}`, {
        displayName,
        bio
      });
      
      if (response.ok) {
        // Rafraîchir les informations utilisateur
        await refreshUserInfo();
        
        toast({
          title: "Profil mis à jour",
          description: "Vos informations ont été enregistrées avec succès.",
        });
      } else {
        throw new Error("Échec de la mise à jour du profil");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du profil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Profil utilisateur</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Colonne 1: Carte profil principal */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-primary" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>
                  Mettez à jour vos informations personnelles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div>
                      <Label htmlFor="displayName">Nom d'utilisateur</Label>
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Entrez votre nom d'utilisateur"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={currentUser.email || ""}
                        disabled
                        className="bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Votre adresse email ne peut pas être modifiée.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="bio">Biographie</Label>
                  <textarea
                    id="bio"
                    placeholder="Parlez-nous de vous en quelques mots..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleUpdateProfile} 
                  className="ml-auto"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Colonne 2: Informations compte et statistiques */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Votre compte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Plan</span>
                  {userInfo.plan === 'premium' ? (
                    <Badge variant="default" className="bg-amber-500">Premium</Badge>
                  ) : (
                    <Badge variant="outline">Gratuit</Badge>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Date d'inscription</span>
                  <span className="text-sm">
                    {currentUser.metadata?.creationTime 
                      ? new Date(currentUser.metadata.creationTime).toLocaleDateString() 
                      : 'Inconnue'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Dernière connexion</span>
                  <span className="text-sm">
                    {currentUser.metadata?.lastSignInTime 
                      ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString() 
                      : 'Inconnue'}
                  </span>
                </div>
                
                {userInfo.plan !== 'premium' && (
                  <Button variant="outline" className="w-full mt-4">
                    <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                    Passer au plan premium
                  </Button>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookText className="h-5 w-5 text-primary" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5">
                  <p className="text-sm text-muted-foreground">Livres créés</p>
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-2xl font-semibold">{userInfo.booksCreated || 0}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10">
                      {userInfo.plan === 'premium' ? 'Illimité' : `Max. 3`}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-primary/5">
                  <p className="text-sm text-muted-foreground">Livres IA générés</p>
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-2xl font-semibold">{userInfo.aiBooksCreated || 0}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10">
                      {userInfo.plan === 'premium' ? 'Illimité' : `Max. 1`}
                    </span>
                  </div>
                </div>
                
                <Button variant="link" className="w-full" onClick={() => window.location.href = '/dashboard'}>
                  Voir tous mes livres
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}