import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const { currentUser } = useAuth();
  const [location, navigate] = useLocation();
  const [redirectPath, setRedirectPath] = useState('/dashboard');

  // Extraire le chemin de redirection des paramètres d'URL si présent
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectPath(decodeURIComponent(redirect));
    }
  }, []);

  // Rediriger vers la page d'origine ou d'accueil si déjà connecté
  useEffect(() => {
    if (currentUser) {
      navigate(redirectPath);
    }
  }, [currentUser, navigate, redirectPath]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Helmet>
        <title>Connexion | Clustica - Magical</title>
      </Helmet>
      
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Connexion</CardTitle>
          <CardDescription className="text-center">
            Connectez-vous à votre compte Clustica - Magical
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm redirectPath={redirectPath} />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-500">
            Vous n'avez pas de compte ?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Créer un compte
            </Link>
          </div>
          <div className="text-xs text-center text-gray-400">
            <Link href="/" className="hover:underline">
              Retour à l'accueil
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}