import React, { useState, useEffect } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { IconGitHub, IconAlertCircle, IconCheck } from './Icons';

const LoginPage: React.FC = () => {
  const { signIn } = useAuthActions();
  const checkAuthConfig = useAction(api.auth.checkAuthConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);

  // Verificar configuração ao carregar
  useEffect(() => {
    const verifyConfig = async () => {
      try {
        setIsCheckingConfig(true);
        const config = await checkAuthConfig();
        
        // Se houver erro na resposta, não mostrar erro crítico
        if (config.error) {
          console.warn('Aviso ao verificar configuração:', config.error);
          // Não definir configError, apenas logar o aviso
        }
        
        if (!config.configured) {
          const missingVars = config.missing.join(', ');
          setConfigError(
            `Configuração incompleta: faltam as variáveis ${missingVars}. ` +
            `Configure em: https://dashboard.convex.dev → Settings → Environment Variables`
          );
        } else {
          setConfigError(null);
        }
      } catch (err) {
        console.error('Erro ao verificar configuração:', err);
        // Não mostrar erro crítico, apenas logar
        // A verificação é opcional e não deve bloquear o login
        setConfigError(null);
      } finally {
        setIsCheckingConfig(false);
      }
    };

    verifyConfig();
  }, [checkAuthConfig]);

  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[LoginPage] Iniciando autenticação GitHub...');
      
      // Verificar se estamos em produção
      const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
      console.log('[LoginPage] Ambiente:', isProduction ? 'Produção' : 'Desenvolvimento');
      console.log('[LoginPage] URL atual:', window.location.href);
      
      // Chamar signIn - isso deve redirecionar automaticamente
      await signIn('github');
      
      // Se chegou aqui sem redirecionar, pode ser um problema
      // Mas não vamos definir isLoading como false imediatamente
      // pois o redirecionamento pode estar em andamento
      console.log('[LoginPage] signIn chamado com sucesso, aguardando redirecionamento...');
      
    } catch (err: any) {
      console.error('[LoginPage] Erro ao fazer login:', err);
      console.error('[LoginPage] Detalhes do erro:', {
        message: err?.message,
        stack: err?.stack,
        name: err?.name,
        cause: err?.cause,
        fullError: String(err)
      });
      
      const errorMessage = err?.message || String(err) || 'Erro ao fazer login com GitHub. Tente novamente.';
      
      // Verificar se é erro de redirect_uri
      if (errorMessage.includes('redirect_uri') || String(err).includes('redirect_uri')) {
        setError('redirect_uri');
      } else if (errorMessage.includes('Server Error') || errorMessage.includes('CONVEX')) {
        // Erro do servidor Convex - fornecer informações mais detalhadas
        setError(
          `Erro no servidor Convex: ${errorMessage}\n\n` +
          `Possíveis causas:\n` +
          `1. Variável SITE_URL não configurada no Convex Dashboard\n` +
          `2. AUTH_GITHUB_ID ou AUTH_GITHUB_SECRET não configuradas\n` +
          `3. URL de callback incorreta no GitHub OAuth App\n\n` +
          `Verifique: https://dashboard.convex.dev → Settings → Environment Variables`
        );
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

          {/* Config Error Message */}
          {configError && (
            <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <IconAlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-400 mb-1">
                    ⚠️ Configuração do Servidor
                  </p>
                  <p className="text-xs text-yellow-300/80">{configError}</p>
                </div>
              </div>
            </div>
          )}

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
                      <div className="mt-3 p-3 bg-zinc-800/50 rounded border border-zinc-700">
                        <p className="text-xs text-zinc-400 mb-2">A URL de callback deve ser:</p>
                        <code className="text-xs text-emerald-400 break-all font-mono">
                          https://cautious-buzzard-249.convex.site/api/auth/callback/github
                        </code>
                        <p className="text-xs text-zinc-500 mt-2">
                          ⚠️ IMPORTANTE: A URL deve terminar com <strong>/callback/github</strong>
                        </p>
                        <p className="text-xs text-red-400 mt-2">
                          ❌ ERRADO: .../api/auth (sem /callback/github)
                        </p>
                        <p className="text-xs text-emerald-400 mt-1">
                          ✅ CORRETO: .../api/auth/callback/github
                        </p>
                      </div>
                      <p className="text-xs text-zinc-400 mt-2">
                        Verifique a documentação: CORRIGIR_REDIRECT_URI_GITHUB.md
                      </p>
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
            disabled={isLoading || isCheckingConfig || !!configError}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading || isCheckingConfig ? (
              <>
                <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-zinc-200 font-medium">
                  {isCheckingConfig ? 'Verificando configuração...' : 'Conectando...'}
                </span>
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
