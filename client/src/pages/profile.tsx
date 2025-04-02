import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Layout from "@/components/ui/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, BookText, User, UserCircle, Save, Loader2, Lock, KeyRound, AlertTriangle, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Profile() {
  const { currentUser, userInfo, refreshUserInfo, changePassword, resetPassword, deleteAccount, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [displayName, setDisplayName] = useState(userInfo?.displayName || "");
  const [bio, setBio] = useState(userInfo?.bio || "");
  const [isLoading, setIsLoading] = useState(false);
  
  // États pour le changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // États pour la réinitialisation de mot de passe
  const [resetEmail, setResetEmail] = useState(currentUser?.email || "");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // États pour la suppression de compte
  const [confirmDeletePassword, setConfirmDeletePassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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
  
  // Gérer le changement de mot de passe
  const handleChangePassword = async (closeDialog: () => void) => {
    // Vérifier que les mots de passe correspondent
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsChangingPassword(true);
      
      await changePassword(currentPassword, newPassword);
      
      toast({
        title: "Succès",
        description: "Votre mot de passe a été modifié avec succès",
      });
      
      // Réinitialiser les champs
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Fermer la boîte de dialogue
      closeDialog();
    } catch (error) {
      console.error("Erreur de changement de mot de passe:", error);
      
      let errorMessage = "Une erreur est survenue lors du changement de mot de passe";
      
      // Si c'est une erreur Firebase, afficher un message plus précis
      if (error instanceof Error) {
        if (error.message.includes("auth/wrong-password")) {
          errorMessage = "Le mot de passe actuel est incorrect";
        } else if (error.message.includes("auth/weak-password")) {
          errorMessage = "Le nouveau mot de passe est trop faible. Utilisez au moins 6 caractères";
        }
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // Gérer la réinitialisation de mot de passe
  const handleResetPassword = async (closeDialog: () => void) => {
    try {
      setIsResettingPassword(true);
      
      await resetPassword(resetEmail);
      
      toast({
        title: "Succès",
        description: "Un email de réinitialisation de mot de passe a été envoyé à votre adresse email",
      });
      
      // Fermer la boîte de dialogue
      closeDialog();
    } catch (error) {
      console.error("Erreur de réinitialisation de mot de passe:", error);
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de l'email de réinitialisation",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };
  
  // Gérer la suppression du compte
  const handleDeleteAccount = async (closeDialog: () => void) => {
    try {
      setIsDeletingAccount(true);
      
      await deleteAccount(confirmDeletePassword);
      
      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès. Vous allez être redirigé vers la page d'accueil",
      });
      
      // Fermer la boîte de dialogue
      closeDialog();
      
      // Rediriger vers la page d'accueil après un délai pour permettre à l'utilisateur de lire le message
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    } catch (error) {
      console.error("Erreur de suppression de compte:", error);
      
      let errorMessage = "Une erreur est survenue lors de la suppression du compte";
      
      // Si c'est une erreur Firebase, afficher un message plus précis
      if (error instanceof Error) {
        if (error.message.includes("auth/wrong-password")) {
          errorMessage = "Le mot de passe est incorrect";
        }
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
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
            
            <Card className="mb-6">
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
            
            {/* Carte de sécurité et gestion de compte */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Sécurité
                </CardTitle>
                <CardDescription>
                  Gérez votre mot de passe et les paramètres de sécurité
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bouton de changement de mot de passe */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full flex justify-between">
                      <span>Changer de mot de passe</span>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Changer de mot de passe</DialogTitle>
                      <DialogDescription>
                        Entrez votre mot de passe actuel et votre nouveau mot de passe
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Mot de passe actuel</Label>
                        <Input
                          id="current-password"
                          type="password"
                          placeholder="Votre mot de passe actuel"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nouveau mot de passe</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Votre nouveau mot de passe"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmez le mot de passe</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirmez votre nouveau mot de passe"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        className="mr-auto"
                        onClick={() => {
                          const closeButton = document.querySelector('[data-radix-focus-guard]')?.parentElement?.querySelector('button[aria-label="Close"]');
                          if (closeButton instanceof HTMLButtonElement) closeButton.click();
                        }}
                      >
                        Annuler
                      </Button>
                      <Button 
                        onClick={() => {
                          const close = () => {
                            // Trouver et fermer la boîte de dialogue
                            const closeButton = document.querySelector('[data-radix-focus-guard]')?.parentElement?.querySelector('button[aria-label="Close"]');
                            if (closeButton instanceof HTMLButtonElement) closeButton.click();
                          };
                          handleChangePassword(close);
                        }}
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Traitement...
                          </>
                        ) : (
                          <>Confirmer</>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                {/* Bouton de réinitialisation de mot de passe */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full flex justify-between">
                      <span>Réinitialiser le mot de passe</span>
                      <Mail className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Réinitialiser votre mot de passe</DialogTitle>
                      <DialogDescription>
                        Un email de réinitialisation de mot de passe sera envoyé à l'adresse suivante
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        className="mr-auto"
                        onClick={() => {
                          const closeButton = document.querySelector('[data-radix-focus-guard]')?.parentElement?.querySelector('button[aria-label="Close"]');
                          if (closeButton instanceof HTMLButtonElement) closeButton.click();
                        }}
                      >
                        Annuler
                      </Button>
                      <Button 
                        onClick={() => {
                          const close = () => {
                            // Trouver et fermer la boîte de dialogue
                            const closeButton = document.querySelector('[data-radix-focus-guard]')?.parentElement?.querySelector('button[aria-label="Close"]');
                            if (closeButton instanceof HTMLButtonElement) closeButton.click();
                          };
                          handleResetPassword(close);
                        }}
                        disabled={isResettingPassword}
                      >
                        {isResettingPassword ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Envoi...
                          </>
                        ) : (
                          <>Envoyer l'email</>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                {/* Bouton de suppression de compte */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full mt-6 flex justify-between">
                      <span>Supprimer mon compte</span>
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer votre compte</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Elle supprimera définitivement votre compte et toutes vos données associées.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="delete-password">Confirmez avec votre mot de passe</Label>
                        <Input
                          id="delete-password"
                          type="password"
                          placeholder="Entrez votre mot de passe"
                          value={confirmDeletePassword}
                          onChange={(e) => setConfirmDeletePassword(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.preventDefault();
                          const closeBtn = document.querySelector('[data-alert-dialog-cancel]') as HTMLButtonElement;
                          handleDeleteAccount(() => closeBtn?.click());
                        }}
                        disabled={isDeletingAccount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeletingAccount ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Suppression...
                          </>
                        ) : (
                          <>Supprimer définitivement</>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}