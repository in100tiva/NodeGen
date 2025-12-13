import { useState, useEffect } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export function useGitHubAuth(userId: string = "dev-user-123") {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [userInfo, setUserInfo] = useState<{ login: string; name?: string } | null>(null);

  const tokenData = useQuery(api.github.getGitHubToken, { userId });
  const validateToken = useAction(api.github.validateGitHubToken);
  const initiateOAuth = useAction(api.github.initiateOAuth);

  useEffect(() => {
    const checkAuth = async () => {
      setIsChecking(true);
      if (tokenData) {
        if (tokenData.expired || !tokenData.token) {
          setIsAuthorized(false);
          setUserInfo(null);
        } else {
          try {
            const validation = await validateToken({ userId });
            setIsAuthorized(validation.valid);
            if (validation.valid && validation.user) {
              setUserInfo(validation.user);
            } else {
              setUserInfo(null);
            }
          } catch (error) {
            console.error('Erro ao validar token GitHub:', error);
            setIsAuthorized(false);
            setUserInfo(null);
          }
        }
      } else {
        setIsAuthorized(false);
        setUserInfo(null);
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [tokenData, validateToken, userId]);

  const initiateAuth = async () => {
    try {
      const { authUrl } = await initiateOAuth({ userId });
      // Abrir popup para autorização
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      window.open(
        authUrl,
        'GitHub Authorization',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );
    } catch (error) {
      console.error('Erro ao iniciar autorização:', error);
      throw error;
    }
  };

  const revokeAuth = async () => {
    // TODO: Implementar revogação de token no backend
    setIsAuthorized(false);
    setUserInfo(null);
  };

  return {
    isAuthorized,
    isChecking,
    userInfo,
    initiateAuth,
    revokeAuth,
  };
}
