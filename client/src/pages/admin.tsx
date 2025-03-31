import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import DropboxManager from '../components/admin/DropboxManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  const { currentUser, userInfo } = useAuth();
  const [location, setLocation] = useLocation();

  // Rediriger si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!currentUser) {
      setLocation('/login?redirect=/admin');
    }
  }, [currentUser, setLocation]);

  if (!currentUser || !userInfo) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Administration</h1>
      
      <Tabs defaultValue="dropbox" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dropbox">Dropbox</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dropbox" className="py-4">
          <DropboxManager />
        </TabsContent>
        
        <TabsContent value="users" className="py-4">
          <div className="text-center p-8">
            <p>La gestion des utilisateurs sera disponible prochainement.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}