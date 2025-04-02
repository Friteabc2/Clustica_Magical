import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  deleteUser,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User, 
  UserCredential 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  currentUser: User | null;
  userInfo: UserInfo | null;
  loading: boolean;
  register: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  refreshUserInfo: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

interface UserInfo {
  id: number;
  email: string;
  displayName: string | null;
  bio?: string;
  plan: 'free' | 'premium';
  booksCreated: number;
  aiBooksCreated: number;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("État de l'authentification Firebase changé:", user ? `Utilisateur connecté: ${user.uid}` : "Aucun utilisateur");
      setCurrentUser(user);
      
      if (user) {
        try {
          // Récupérer les informations utilisateur depuis le backend
          console.log("Tentative de récupération des informations utilisateur pour:", user.uid);
          const response = await fetch(`/api/auth/user/${user.uid}`, {
            method: 'GET',
            credentials: 'include'
          });

          console.log("Réponse de récupération utilisateur:", response.status);
          
          if (response.status === 200) {
            const userData = await response.json();
            console.log("Données utilisateur récupérées:", userData);
            setUserInfo(userData);
          } else if (response.status === 404) {
            // L'utilisateur existe dans Firebase mais pas dans notre backend
            console.log("Création automatique de l'utilisateur dans le backend:", {
              firebaseUid: user.uid,
              email: user.email,
              displayName: user.displayName
            });
            
            try {
              const registerResponse = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  firebaseUid: user.uid,
                  email: user.email || 'unknown@email.com',
                  displayName: user.displayName || 'Utilisateur',
                  plan: 'free',
                  booksCreated: 0,
                  aiBooksCreated: 0
                }),
                credentials: 'include'
              });
              
              console.log("Réponse d'inscription:", registerResponse.status);
              
              if (registerResponse.status === 201) {
                const newUserData = await registerResponse.json();
                console.log("Nouvel utilisateur créé:", newUserData);
                setUserInfo(newUserData);
              } else if (registerResponse.status === 409) {
                // L'utilisateur existe déjà, essayons de le récupérer à nouveau
                console.log("L'utilisateur existe déjà, tentative de récupération...");
                const retryResponse = await fetch(`/api/auth/user/${user.uid}`, {
                  method: 'GET',
                  credentials: 'include'
                });
                
                if (retryResponse.ok) {
                  const userData = await retryResponse.json();
                  console.log("Données utilisateur récupérées après conflit:", userData);
                  setUserInfo(userData);
                } else {
                  console.error("Échec de la récupération de l'utilisateur après conflit:", retryResponse.status);
                  setUserInfo(null);
                }
              } else {
                const errorData = await registerResponse.text();
                console.error("Échec de la création automatique de l'utilisateur:", registerResponse.status, errorData);
                setUserInfo(null);
              }
            } catch (registerError) {
              console.error("Exception lors de l'enregistrement:", registerError);
              setUserInfo(null);
            }
          } else {
            const errorText = await response.text();
            console.error("Erreur HTTP lors de la récupération utilisateur:", response.status, errorText);
            throw new Error(`Erreur de récupération des informations utilisateur: ${response.status} ${errorText}`);
          }
        } catch (error) {
          console.error("Erreur de récupération des informations utilisateur:", error instanceof Error ? error.message : String(error));
          setUserInfo(null);
        }
      } else {
        setUserInfo(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function register(email: string, password: string, displayName: string) {
    try {
      // Créer l'utilisateur dans Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Mettre à jour le nom d'affichage dans Firebase
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      // Note: La création dans le backend est gérée automatiquement dans l'écouteur onAuthStateChanged
      // On n'a donc pas besoin de faire un second appel à register ici
      
      return userCredential;
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      throw error;
    }
  }

  function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
      throw error;
    }
  }
  
  async function refreshUserInfo() {
    if (!currentUser?.uid) return;
    
    try {
      console.log("Rafraîchissement des informations utilisateur pour:", currentUser.uid);
      const response = await fetch(`/api/auth/user/${currentUser.uid}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.status === 200) {
        const userData = await response.json();
        console.log("Données utilisateur rafraîchies:", userData);
        setUserInfo(userData);
      } else {
        console.error("Erreur lors du rafraîchissement des informations utilisateur:", response.status);
      }
    } catch (error) {
      console.error("Exception lors du rafraîchissement des informations utilisateur:", error);
    }
  }

  // Fonction pour changer le mot de passe
  async function changePassword(currentPassword: string, newPassword: string) {
    if (!currentUser || !currentUser.email) {
      throw new Error("Aucun utilisateur connecté");
    }

    try {
      // Réauthentifier l'utilisateur avant de changer le mot de passe
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);
      
      // Changer le mot de passe
      await updatePassword(currentUser, newPassword);
    } catch (error) {
      console.error("Erreur de changement de mot de passe:", error);
      throw error;
    }
  }

  // Fonction pour réinitialiser le mot de passe par email
  async function resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Erreur d'envoi d'email de réinitialisation:", error);
      throw error;
    }
  }

  // Fonction pour supprimer un compte
  async function deleteAccount(password: string) {
    if (!currentUser || !currentUser.email || !userInfo) {
      throw new Error("Aucun utilisateur connecté");
    }

    try {
      // Réauthentifier l'utilisateur avant de supprimer le compte
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        password
      );

      await reauthenticateWithCredential(currentUser, credential);
      
      // Supprimer l'utilisateur de notre backend
      const response = await apiRequest("DELETE", `/api/auth/user/${userInfo.id}`);
      
      if (!response.ok) {
        throw new Error("Échec de la suppression du compte dans le backend");
      }
      
      // Supprimer l'utilisateur de Firebase
      await deleteUser(currentUser);
    } catch (error) {
      console.error("Erreur de suppression de compte:", error);
      throw error;
    }
  }

  const value = {
    currentUser,
    userInfo,
    loading,
    register,
    login,
    logout,
    refreshUserInfo,
    changePassword,
    resetPassword,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}