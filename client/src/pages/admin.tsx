import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import CloudManager from '../components/admin/CloudManager';
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
      
      <Tabs defaultValue="cloud" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="cloud">Cloud</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cloud" className="py-4">
          <CloudManager />
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