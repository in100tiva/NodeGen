import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import App from './App';
import './index.css';

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  console.error('VITE_CONVEX_URL não está configurada!');
  console.error('Configure a variável de ambiente VITE_CONVEX_URL com a URL do seu projeto Convex.');
  console.error('Você pode obter a URL executando: npx convex dev');
}

const convex = new ConvexReactClient(convexUrl || '');

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </React.StrictMode>
  );
}