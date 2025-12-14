import { useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function useAuth() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  
  // Obter informações do usuário autenticado
  const user = useQuery(api.auth.getCurrentUser);

  const logout = async () => {
    // O logout será feito via useAuthActions no componente
    // Esta função é mantida para compatibilidade
    console.log('Use signOut from useAuthActions para fazer logout');
  };

  return {
    isAuthenticated: isAuthenticated && !!user,
    isLoading: authLoading,
    userId: user?.tokenIdentifier || null,
    user,
    logout,
  };
}
