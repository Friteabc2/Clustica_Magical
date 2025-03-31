import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
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
}

interface UserInfo {
  id: number;
  email: string;
  displayName: string | null;
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
      setCurrentUser(user);
      
      if (user) {
        try {
          // Récupérer les informations utilisateur depuis le backend
          const response = await apiRequest('GET', `/api/auth/user/${user.uid}`);
          
          if (response.ok) {
            const userData = await response.json();
            setUserInfo(userData);
          } else if (response.status === 404) {
            // L'utilisateur existe dans Firebase mais pas dans notre backend
            // Créons-le automatiquement
            console.log("Création automatique de l'utilisateur dans le backend");
            
            const registerResponse = await apiRequest('POST', '/api/auth/register', {
              firebaseUid: user.uid,
              email: user.email || 'unknown@email.com',
              displayName: user.displayName || 'Utilisateur'
            });
            
            if (registerResponse.ok) {
              const newUserData = await registerResponse.json();
              setUserInfo(newUserData);
            } else {
              console.error("Échec de la création automatique de l'utilisateur");
              setUserInfo(null);
            }
          } else {
            throw new Error("Erreur de récupération des informations utilisateur");
          }
        } catch (error) {
          console.error("Erreur de récupération des informations utilisateur:", error instanceof Error ? error.message : error);
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
      
      // Créer l'utilisateur dans notre backend
      if (userCredential.user) {
        await apiRequest('POST', '/api/auth/register', {
          firebaseUid: userCredential.user.uid,
          email: email,
          displayName: displayName
        });
      }
      
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

  const value = {
    currentUser,
    userInfo,
    loading,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}