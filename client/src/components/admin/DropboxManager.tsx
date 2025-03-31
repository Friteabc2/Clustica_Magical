import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type DropboxStatus = {
  status: 'connected' | 'error' | 'checking';
  message: string;
  error?: string;
};

export default function DropboxManager() {
  const [status, setStatus] = useState<DropboxStatus>({ 
    status: 'checking', 
    message: 'Vérification de la connexion Dropbox...' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Vérifier le statut de la connexion Dropbox
  useEffect(() => {
    checkDropboxStatus();
  }, []);

  const checkDropboxStatus = async () => {
    try {
      setStatus({ status: 'checking', message: 'Vérification de la connexion Dropbox...' });
      
      const response = await apiRequest('GET', '/api/dropbox/status');
      if (response.ok) {
        const data = await response.json();
        setStatus({ 
          status: 'connected', 
          message: data.message || 'La connexion Dropbox est active.' 
        });
      } else {
        const data = await response.json();
        setStatus({ 
          status: 'error', 
          message: data.message || 'Erreur de connexion Dropbox.', 
          error: data.error 
        });
      }
    } catch (error) {
      setStatus({ 
        status: 'error', 
        message: 'Impossible de vérifier la connexion Dropbox.', 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
    }
  };

  const handleOpenInstructions = () => {
    toast({
      title: "Instructions pour Dropbox",
      description: 
        "Consultez le fichier 'obtenir_token_dropbox_longuedure.md' à la racine du projet pour obtenir des instructions détaillées sur la façon de générer un token d'accès Dropbox à longue durée.",
      duration: 8000,
    });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Gestion de la connexion Dropbox</CardTitle>
        <CardDescription>
          Vérifiez le statut de la connexion Dropbox et mettez à jour le token d'accès si nécessaire.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status.status === 'checking' && (
          <Alert>
            <AlertTitle>Vérification en cours</AlertTitle>
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}
        
        {status.status === 'connected' && (
          <Alert className="bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">Connecté</AlertTitle>
            <AlertDescription className="text-green-700">{status.message}</AlertDescription>
          </Alert>
        )}
        
        {status.status === 'error' && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTitle className="text-red-800">Erreur de connexion</AlertTitle>
            <AlertDescription className="text-red-700">
              {status.message}
              {status.error && (
                <p className="mt-2 text-xs font-mono bg-red-100 p-2 rounded">
                  {status.error}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Obtenir un nouveau token d'accès</h3>
          <p className="text-sm text-gray-600 mb-4">
            Pour configurer un token d'accès Dropbox longue durée, suivez les instructions dans le guide fourni.
          </p>
          <Button 
            variant="outline" 
            onClick={handleOpenInstructions}
            className="mb-4"
          >
            Voir les instructions
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <Button 
          onClick={checkDropboxStatus} 
          variant="outline"
        >
          Vérifier à nouveau
        </Button>
      </CardFooter>
    </Card>
  );
}