import React, { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { IconGitHub, IconAlertCircle, IconCheck } from './Icons';

const LoginPage: React.FC = () => {
  const { signIn } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authConfig = useQuery(api.auth.checkAuthConfig);

  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await signIn('github');
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);
      const errorMessage = err?.message || 'Erro ao fazer login com GitHub. Tente novamente.';
      
      // Verificar se é erro de redirect_uri
      if (errorMessage.includes('redirect_uri') || String(err).includes('redirect_uri')) {
        setError('redirect_uri');
      } else {
        setError(errorMessage);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4">
            <span className="text-2xl font-bold text-white">N</span>
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">NodeGen Studio</h1>
          <p className="text-sm text-zinc-400">OpenRouter Integration</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface border border-border rounded-xl p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-zinc-100 mb-2">Bem-vindo</h2>
            <p className="text-sm text-zinc-400">
              Faça login com sua conta GitHub para começar a criar workflows
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <IconAlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  {error === 'redirect_uri' ? (
                    <>
                      <p className="text-sm font-medium text-red-400 mb-2">
                        Erro de configuração: redirect_uri não associada à aplicação
                      </p>
                      <p className="text-xs text-red-300/80 mb-3">
                        A URL de callback no GitHub OAuth App não corresponde à URL do Convex.
                      </p>
                      {authConfig?.callbackUrl && authConfig.callbackUrl !== "não disponível" ? (
                        <div className="mt-3 p-3 bg-zinc-800/50 rounded border border-zinc-700">
                          <p className="text-xs text-zinc-400 mb-2">Configure esta URL no GitHub OAuth App:</p>
                          <code className="text-xs text-emerald-400 break-all font-mono">
                            {authConfig.callbackUrl}
                          </code>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400">
                          Verifique a documentação: CORRIGIR_REDIRECT_URI_GITHUB.md
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-red-400">{error}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* GitHub Login Button */}
          <button
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-zinc-200 font-medium">Conectando...</span>
              </>
            ) : (
              <>
                <IconGitHub className="w-5 h-5 text-zinc-300 group-hover:text-white transition-colors" />
                <span className="text-zinc-200 font-medium group-hover:text-white transition-colors">
                  Continuar com GitHub
                </span>
              </>
            )}
          </button>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-zinc-500 text-center">
              Ao continuar, você concorda com nossos termos de serviço e política de privacidade
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-500">
            Precisa de ajuda?{' '}
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent transition-colors">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
