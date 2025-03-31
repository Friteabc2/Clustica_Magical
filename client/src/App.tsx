import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Editor from "@/pages/editor";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Admin from "@/pages/admin";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import PrivateRoute from "@/components/auth/PrivateRoute";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/ui/page-transition";

function Router() {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Switch key={location}>
        {/* Page d'accueil publique */}
        <Route path="/">
          {() => (
            <PageTransition>
              <Landing />
            </PageTransition>
          )}
        </Route>
        
        <Route path="/login">
          {() => (
            <PageTransition>
              <Login />
            </PageTransition>
          )}
        </Route>
        
        <Route path="/register">
          {() => (
            <PageTransition>
              <Register />
            </PageTransition>
          )}
        </Route>
        
        {/* Routes protégées qui nécessitent une authentification */}
        <Route path="/dashboard">
          {() => (
            <PageTransition>
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            </PageTransition>
          )}
        </Route>
        
        <Route path="/editor/:id">
          {({id}) => (
            <PageTransition>
              <PrivateRoute>
                <Editor params={{id}} />
              </PrivateRoute>
            </PageTransition>
          )}
        </Route>
        
        <Route path="/editor">
          {() => (
            <PageTransition>
              <PrivateRoute>
                <Editor />
              </PrivateRoute>
            </PageTransition>
          )}
        </Route>
        
        <Route path="/admin">
          {() => (
            <PageTransition>
              <PrivateRoute>
                <Admin />
              </PrivateRoute>
            </PageTransition>
          )}
        </Route>

        <Route path="/settings">
          {() => (
            <PageTransition>
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            </PageTransition>
          )}
        </Route>
        
        <Route>
          {() => (
            <PageTransition>
              <NotFound />
            </PageTransition>
          )}
        </Route>
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Router />
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
