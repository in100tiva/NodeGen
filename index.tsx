import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexReactClient, Authenticated, Unauthenticated } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import App from './App';
import LoginPage from './components/LoginPage';
import './index.css';

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
      <ConvexAuthProvider client={convex}>
        <Authenticated>
          <App />
        </Authenticated>
        <Unauthenticated>
          <LoginPage />
        </Unauthenticated>
      </ConvexAuthProvider>
    </React.StrictMode>
  );
}