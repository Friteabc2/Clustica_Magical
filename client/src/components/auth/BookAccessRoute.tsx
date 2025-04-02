import React, { useEffect, useState } from 'react';
import { Redirect, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface BookAccessRouteProps {
  children: React.ReactNode;
  bookId: string;
}

export default function BookAccessRoute({ children, bookId }: BookAccessRouteProps) {
  const { currentUser, userInfo, loading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur a le droit d'accéder au livre
  useEffect(() => {
    if (loading) return;
    
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    // Vérifier l'accès au livre
    async function checkAccess() {
      try {
        const response = await fetch(`/api/books/${bookId}?userId=${userInfo?.id || ''}`);
        
        if (response.ok) {
          setIsAuthorized(true);
        } else {
          if (response.status === 403) {
            setError("Vous n'avez pas l'autorisation d'accéder à ce livre. Seul le créateur du livre peut y accéder.");
          } else {
            setError("Impossible de charger le livre demandé.");
          }
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error("Erreur lors de la vérification d'accès:", err);
        setError("Une erreur est survenue lors de la vérification des droits d'accès.");
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [bookId, currentUser, loading, userInfo]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">Vérification des droits d'accès...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // Afficher un toast explicatif pour la redirection
    toast({
      title: "Connexion requise",
      description: "Vous devez être connecté pour accéder à cette page.",
      variant: "default"
    });
    
    // On passe la page actuelle comme paramètre pour pouvoir y revenir après connexion
    return <Redirect to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} />;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Accès non autorisé
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "Vous n'avez pas l'autorisation d'accéder à ce livre."}
          </p>
          <Button onClick={() => navigate('/dashboard')} className="bg-primary hover:bg-primary/90">
            Retour à la liste des livres
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}