import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import RegisterForm from "@/components/auth/RegisterForm";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Register() {
  const { currentUser } = useAuth();
  const [, navigate] = useLocation();

  // Rediriger vers la page d'accueil si déjà connecté
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Helmet>
        <title>Créer un compte | Clustica - Magical</title>
      </Helmet>
      
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Créer un compte</CardTitle>
          <CardDescription className="text-center">
            Créez votre compte Clustica - Magical pour commencer à écrire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-500">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Se connecter
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