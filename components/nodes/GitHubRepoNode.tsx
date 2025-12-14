import React, { useState, useEffect, useRef } from 'react';
import { Node } from '../../types';
import { useAction, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { IconGitHub, IconAlertCircle, IconCheck } from '../Icons';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useAuth } from '../../hooks/useAuth';

interface GitHubRepoNodeProps {
  node: Node;
  onUpdateData: (nodeId: string, data: any) => void;
}

const GitHubRepoNode: React.FC<GitHubRepoNodeProps> = ({ node, onUpdateData }) => {
  // Obter userId do hook de autenticação
  const { userId } = useAuth();
  const actualUserId = userId || "dev-user-123"; // Fallback temporário
  
  const [repoInput, setRepoInput] = useState(node.data.githubRepo || '');
  const [branch, setBranch] = useState(node.data.githubBranch || 'main');
  const [path, setPath] = useState(node.data.githubPath || '');
  const [searchQuery, setSearchQuery] = useState(node.data.githubSearchQuery || '');
  const [mode, setMode] = useState<'list' | 'read' | 'search'>(node.data.githubMode || 'list');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const initiateOAuth = useAction(api.github.initiateOAuth);
  const validateToken = useAction(api.github.validateGitHubToken);
  
  // Usar useQuery normalmente - se der erro, será tratado pelo Error Boundary no NodeCard
  const tokenData = useQuery(api.github.getGitHubToken, { userId: actualUserId });

  const [authStatus, setAuthStatus] = useState<'unknown' | 'authorized' | 'unauthorized'>('unknown');

  // Verificar status de autenticação
  useEffect(() => {
    const checkAuth = async () => {
      // Se tokenData é undefined, ainda está carregando
      if (tokenData === undefined) {
        return;
      }
      
      if (tokenData === null) {
        setAuthStatus('unauthorized');
        return;
      }
      
      if (tokenData.expired || !tokenData.token) {
        setAuthStatus('unauthorized');
      } else {
        try {
          const validation = await validateToken({ userId });
          setAuthStatus(validation.valid ? 'authorized' : 'unauthorized');
        } catch (error) {
          setAuthStatus('unauthorized');
        }
      }
    };
    checkAuth();
  }, [tokenData, validateToken, userId]);

  // Função para atualizar dados do nó (usar useCallback para evitar recriação)
  const updateNodeData = React.useCallback(() => {
    onUpdateData(node.id, {
      githubRepo: repoInput,
      githubBranch: branch,
      githubPath: path,
      githubSearchQuery: searchQuery,
      githubMode: mode,
    });
  }, [node.id, repoInput, branch, path, searchQuery, mode, onUpdateData]);

  // Listener para mensagem de sucesso do OAuth
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'github-auth-success') {
        setIsAuthorizing(false);
        setAuthStatus('authorized');
        
        // Salvar workflowId atual no localStorage antes do reload
        const currentWorkflowId = useWorkflowStore.getState().currentWorkflowId;
        if (currentWorkflowId) {
          localStorage.setItem('pendingWorkflowId', currentWorkflowId);
        }
        
        // Recarregar para atualizar token
        window.location.reload();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    try {
      const { authUrl } = await initiateOAuth({ userId: actualUserId });
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
    } catch (error: any) {
      console.error('Erro ao iniciar autorização:', error);
      let errorMessage = `Erro ao iniciar autorização: ${error?.message || error}`;
      
      // Se o erro mencionar redirect_uri, adicionar instruções
      if (error?.message?.includes('redirect_uri') || String(error).includes('redirect_uri')) {
        errorMessage += '\n\n💡 Dica: Verifique se a Callback URL no GitHub OAuth App corresponde à URL do Convex.';
        errorMessage += '\nVeja: docs/FIX_GITHUB_REDIRECT_URI.md';
      }
      
      alert(errorMessage);
      setIsAuthorizing(false);
    }
  };

  const parseRepo = (repoString: string) => {
    const parts = repoString.split('/');
    if (parts.length === 2) {
      return { owner: parts[0].trim(), repo: parts[1].trim() };
    }
    return null;
  };

  const isValidRepo = repoInput ? parseRepo(repoInput) !== null : false;


  return (
    <div className="p-3 pt-4 space-y-3">
      {/* Status de Autenticação */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-500 uppercase">Status GitHub</label>
          {authStatus === 'authorized' ? (
            <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-mono uppercase px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/30">
              <IconCheck className="w-3 h-3" />
              Autorizado
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[9px] text-red-500 font-mono uppercase px-1.5 py-0.5 bg-red-500/10 rounded border border-red-500/30">
              <IconAlertCircle className="w-3 h-3" />
              Não Autorizado
            </span>
          )}
        </div>
        {authStatus !== 'authorized' && (
          <button
            onClick={handleAuthorize}
            disabled={isAuthorizing}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <IconGitHub className="w-4 h-4" />
            {isAuthorizing ? 'Abrindo...' : 'Conectar GitHub'}
          </button>
        )}
      </div>

      {/* Repositório */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-500 uppercase">Repositório</label>
        <input
          type="text"
          value={repoInput}
          onChange={(e) => setRepoInput(e.target.value)}
          placeholder="owner/repo (ex: facebook/react)"
          className="w-full px-3 py-2 bg-black/20 border border-zinc-700 rounded text-xs text-zinc-200 focus:outline-none focus:border-primary transition-colors"
        />
        {repoInput && !isValidRepo && (
          <p className="text-[9px] text-red-400">Formato inválido. Use: owner/repo</p>
        )}
      </div>

      {/* Branch */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-500 uppercase">Branch</label>
        <input
          type="text"
          value={branch}
          onChange={(e) => {
            setBranch(e.target.value);
            updateNodeData();
          }}
          onBlur={updateNodeData}
          placeholder="main"
          className="w-full px-3 py-2 bg-black/20 border border-zinc-700 rounded text-xs text-zinc-200 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Modo de Operação */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-500 uppercase">Modo</label>
        <select
          value={mode}
          onChange={(e) => {
            setMode(e.target.value as 'list' | 'read' | 'search');
            updateNodeData();
          }}
          className="w-full px-3 py-2 bg-black/20 border border-zinc-700 rounded text-xs text-zinc-200 focus:outline-none focus:border-primary transition-colors"
        >
          <option value="list">Listar Arquivos</option>
          <option value="read">Ler Conteúdo</option>
          <option value="search">Buscar Código</option>
        </select>
      </div>

      {/* Campo específico baseado no modo */}
      {mode === 'read' && (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase">Caminho do Arquivo</label>
          <input
            type="text"
            value={path}
            onChange={(e) => {
              setPath(e.target.value);
              updateNodeData();
            }}
            onBlur={updateNodeData}
            placeholder="src/App.tsx"
            className="w-full px-3 py-2 bg-black/20 border border-zinc-700 rounded text-xs text-zinc-200 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      )}

      {mode === 'search' && (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase">Query de Busca</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              updateNodeData();
            }}
            onBlur={updateNodeData}
            placeholder="function calculateTotal"
            className="w-full px-3 py-2 bg-black/20 border border-zinc-700 rounded text-xs text-zinc-200 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      )}

      {mode === 'list' && (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase">Caminho do Diretório (opcional)</label>
          <input
            type="text"
            value={path}
            onChange={(e) => {
              setPath(e.target.value);
              updateNodeData();
            }}
            onBlur={updateNodeData}
            placeholder="src/components (deixe vazio para raiz)"
            className="w-full px-3 py-2 bg-black/20 border border-zinc-700 rounded text-xs text-zinc-200 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      )}
    </div>
  );
};

export default GitHubRepoNode;
