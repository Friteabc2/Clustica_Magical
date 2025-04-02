import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { RefreshCw, AlertTriangle, CheckCircle2, LinkIcon, UnlinkIcon, CloudIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CloudStatus {
  status: 'connected' | 'expired' | 'error' | null;
  message: string;
  hasRefreshToken?: boolean;
  canAutoRefresh?: boolean;
  oauthUrl?: string;
}

const CloudManager: React.FC = () => {
  const [status, setStatus] = useState<CloudStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cloud/status');
      const data = await res.json();
      setStatus({
        status: data.status,
        message: data.message,
        hasRefreshToken: data.hasRefreshToken || false,
        canAutoRefresh: data.canAutoRefresh || false,
        oauthUrl: data.oauthUrl
      });
    } catch (error) {
      console.error('Erreur lors de la vérification du statut Cloud:', error);
      setStatus({
        status: 'error',
        message: 'Impossible de vérifier l\'état de la connexion Cloud'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const refreshToken = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/cloud/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: manualToken.trim() || undefined })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: "Token mis à jour",
          description: data.message,
          variant: "default"
        });
        
        // Effacer le champ de saisie si la mise à jour a réussi
        if (data.method === 'manual_update') {
          setManualToken('');
        }
        
        // Mettre à jour le statut
        await checkStatus();
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Erreur lors de la mise à jour du token",
          variant: "destructive"
        });
        
        // Si la réponse indique qu'il faut réautoriser, afficher l'information dans le statut
        if (data.needsOAuth) {
          setStatus((prev: CloudStatus | null) => ({
            ...prev!,
            status: 'expired',
            message: data.message,
            oauthUrl: '/api/cloud/oauth'
          }));
        }
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      toast({
        title: "Erreur",
        description: "Impossible de communiquer avec le serveur",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const startOAuth = () => {
    if (status?.oauthUrl) {
      window.location.href = status.oauthUrl;
    }
  };

  const syncBooks = async () => {
    try {
      const res = await fetch('/api/cloud/sync', {
        method: 'POST'
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: "Synchronisation terminée",
          description: data.message,
          variant: "default"
        });
      } else {
        toast({
          title: "Erreur de synchronisation",
          description: data.message || "Erreur lors de la synchronisation avec le Cloud",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation avec le Cloud:', error);
      toast({
        title: "Erreur",
        description: "Impossible de communiquer avec le serveur",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudIcon className="h-5 w-5" />
          <span>Cloud</span>
          {status?.status === 'connected' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          {status?.status === 'expired' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
          {status?.status === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
        </CardTitle>
        <CardDescription>
          Gérez la connexion au Cloud pour la sauvegarde et la synchronisation de vos livres
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!status && (
          <div className="flex justify-center p-4">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        
        {status && (
          <Alert variant={status.status === 'connected' ? "default" : "destructive"}>
            <AlertTitle>Statut: {
              status.status === 'connected' ? 'Connecté' : 
              status.status === 'expired' ? 'Token expiré' : 
              'Erreur'
            }</AlertTitle>
            <AlertDescription>
              {status.message}
            </AlertDescription>
          </Alert>
        )}
        
        {status?.status === 'expired' && (
          <div className="space-y-4 pt-2">
            {status.hasRefreshToken ? (
              <Button 
                onClick={refreshToken} 
                disabled={refreshing}
                className="w-full"
                variant="default"
              >
                {refreshing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Rafraîchir automatiquement
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="text-sm">
                  Deux options pour mettre à jour le token:
                </div>
                <Button 
                  onClick={startOAuth} 
                  className="w-full"
                  variant="outline"
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Autoriser via Cloud OAuth
                </Button>
                <div className="text-sm text-center my-2">ou</div>
                <div className="flex space-x-2">
                  <Input
                    value={manualToken}
                    onChange={e => setManualToken(e.target.value)}
                    placeholder="Access Token Cloud"
                    className="flex-1"
                  />
                  <Button 
                    onClick={refreshToken} 
                    disabled={!manualToken.trim() || refreshing}
                    variant="secondary"
                  >
                    {refreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Mettre à jour"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {status?.status === 'connected' && (
          <div className="space-y-4 pt-2">
            <Button 
              onClick={syncBooks} 
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Enregistrer dans le Cloud
            </Button>
            
            <div className="text-sm text-center mt-2 opacity-70">
              {status.hasRefreshToken 
                ? "Le token sera automatiquement rafraîchi lorsque nécessaire."
                : "Pour permettre le rafraîchissement automatique, utilisez l'authentification OAuth."}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button 
          onClick={checkStatus} 
          disabled={isLoading}
          variant="ghost"
          size="sm"
        >
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span className="ml-2">Vérifier le statut</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CloudManager;