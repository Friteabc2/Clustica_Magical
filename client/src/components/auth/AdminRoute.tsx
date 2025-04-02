import React, { useEffect } from 'react';
import { Redirect, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PrivateRoute from './PrivateRoute';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Component that restricts access to admin-only routes
 * Currently it's configured to always deny access and redirect to dashboard
 * since we're disabling admin access as requested
 */
export default function AdminRoute({ children }: AdminRouteProps) {
  const { currentUser, loading } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();

  // Always show access denied message since we're disabling admin access
  useEffect(() => {
    if (!loading && currentUser) {
      toast({
        title: "Accès refusé",
        description: "La page d'administration est actuellement désactivée.",
        variant: "destructive"
      });
    }
  }, [loading, currentUser, toast]);

  // First use PrivateRoute to ensure user is authenticated
  // Then perform the admin check
  return (
    <PrivateRoute>
      {/* We're disabling admin access, so always redirect to dashboard */}
      <Redirect to="/dashboard" />
    </PrivateRoute>
  );
}