import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Editor from "@/pages/editor";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Admin from "@/pages/admin";
import Landing from "@/pages/landing";
import { AuthProvider } from "@/contexts/AuthContext";
import PrivateRoute from "@/components/auth/PrivateRoute";

function Router() {
  return (
    <Switch>
      {/* Page d'accueil publique */}
      <Route path="/" component={Landing} />
      
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Routes protégées qui nécessitent une authentification */}
      <Route path="/dashboard">
        {() => (
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        )}
      </Route>
      
      <Route path="/editor/:id">
        {({id}) => (
          <PrivateRoute>
            <Editor params={{id}} />
          </PrivateRoute>
        )}
      </Route>
      
      <Route path="/editor">
        {() => (
          <PrivateRoute>
            <Editor />
          </PrivateRoute>
        )}
      </Route>
      
      <Route path="/admin">
        {() => (
          <PrivateRoute>
            <Admin />
          </PrivateRoute>
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
