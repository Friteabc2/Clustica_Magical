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
import Profile from "@/pages/profile";
import Landing from "@/pages/landing";
import Legal from "@/pages/legal";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Guides from "@/pages/guides";
import Community from "@/pages/community";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import PrivateRoute from "@/components/auth/PrivateRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import BookAccessRoute from "@/components/auth/BookAccessRoute";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/ui/page-transition";
import BetaWarningToast from "@/components/BetaWarningToast";

function Router() {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Switch location={location} key={location}>
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

        <Route path="/legal">
          {() => (
            <PageTransition>
              <Legal />
            </PageTransition>
          )}
        </Route>

        <Route path="/privacy">
          {() => (
            <PageTransition>
              <Privacy />
            </PageTransition>
          )}
        </Route>

        <Route path="/terms">
          {() => (
            <PageTransition>
              <Terms />
            </PageTransition>
          )}
        </Route>

        <Route path="/guides">
          {() => (
            <PageTransition>
              <Guides />
            </PageTransition>
          )}
        </Route>

        <Route path="/community">
          {() => (
            <PageTransition>
              <Community />
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
                <BookAccessRoute bookId={id}>
                  <Editor params={{id}} />
                </BookAccessRoute>
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
              <AdminRoute>
                <Admin />
              </AdminRoute>
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

        <Route path="/profile">
          {() => (
            <PageTransition>
              <PrivateRoute>
                <Profile />
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
          <BetaWarningToast />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
