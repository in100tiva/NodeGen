import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexReactClient, Authenticated, Unauthenticated } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import App from './App';
import LoginPage from './components/LoginPage';
import './index.css';

// Componente de erro para capturar problemas de renderização
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Erro capturado:', error);
    console.error('[ErrorBoundary] Detalhes:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-red-500/30 rounded-xl p-8">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Erro na Aplicação</h1>
            <p className="text-zinc-300 mb-4">
              Ocorreu um erro inesperado. Por favor, recarregue a página.
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="text-sm text-zinc-400 cursor-pointer mb-2">
                  Detalhes do erro
                </summary>
                <pre className="text-xs text-zinc-500 bg-zinc-900 p-3 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full px-4 py-2 bg-primary hover:bg-indigo-600 text-white rounded-lg transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

let convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  console.error('VITE_CONVEX_URL não está configurada!');
  console.error('Configure a variável de ambiente VITE_CONVEX_URL com a URL do seu projeto Convex.');
  console.error('Você pode obter a URL executando: npx convex dev');
} else {
  // Validar e corrigir URL se necessário
  const originalUrl = convexUrl;
  
  if (convexUrl.endsWith('.convex.site')) {
    console.warn('⚠️ ATENÇÃO: A URL do Convex termina com .convex.site');
    console.warn('   URLs que terminam com .convex.site são para HTTP Actions, não para deployments.');
    console.warn('   Corrigindo automaticamente para .convex.cloud...');
    
    // Corrigir automaticamente
    convexUrl = convexUrl.replace('.convex.site', '.convex.cloud');
    
    console.warn(`✅ URL corrigida de: ${originalUrl}`);
    console.warn(`✅ URL corrigida para: ${convexUrl}`);
    console.warn('   ⚠️ IMPORTANTE: Atualize a variável VITE_CONVEX_URL na Vercel para usar .convex.cloud');
    console.warn('   📝 Vá em: Vercel Dashboard → Settings → Environment Variables');
    console.warn('   📝 Altere VITE_CONVEX_URL de .convex.site para .convex.cloud');
  } else if (!convexUrl.endsWith('.convex.cloud') && !convexUrl.includes('localhost')) {
    console.warn('⚠️ ATENÇÃO: A URL do Convex pode estar incorreta.');
    console.warn('   URLs de deployment devem terminar com .convex.cloud');
    console.warn(`   URL atual: ${convexUrl}`);
  }
}

// Criar cliente Convex com a URL corrigida
// A URL já foi corrigida automaticamente acima se necessário
const convex = new ConvexReactClient(convexUrl || '');

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ConvexAuthProvider client={convex}>
          <Authenticated>
            <App />
          </Authenticated>
          <Unauthenticated>
            <LoginPage />
          </Unauthenticated>
        </ConvexAuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error('Root container não encontrado!');
}