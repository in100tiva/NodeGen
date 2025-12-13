import { useState, useCallback } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
}

export function useAuth() {
  const [authState] = useState<AuthState>({
    isAuthenticated: true, // Temporário: sempre autenticado em desenvolvimento
    userId: 'dev-user-123',
  });

  const logout = useCallback(() => {
    // TODO: Implementar logout quando autenticação estiver configurada
    console.log('Logout não implementado ainda');
  }, []);

  return {
    isAuthenticated: authState.isAuthenticated,
    userId: authState.userId,
    logout,
  };
}
