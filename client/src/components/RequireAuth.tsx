import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface RequireAuthProps {
  children: ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const [location, setLocation] = useLocation();
  
  // Check authentication status
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['/api/auth/me'],
  });
  
  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!isLoading && (isError || !user)) {
      setLocation("/login");
    }
  }, [user, isLoading, isError, setLocation]);
  
  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }
  
  // If authenticated, render children
  return user ? <>{children}</> : null;
}
