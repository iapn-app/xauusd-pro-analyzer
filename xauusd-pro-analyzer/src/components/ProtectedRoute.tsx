import React from 'react';
import { User } from '../services/authService';

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
  fallback: React.ReactNode;
}

/**
 * ProtectedRoute - A wrapper component that ensures the user is authenticated
 * before rendering the children. If not authenticated, it renders the fallback.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children, fallback }) => {
  if (!user) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
