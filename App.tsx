import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAction, useQuery, useMutation } from 'convex/react';
import { api } from './convex/_generated/api';
import { Id } from './convex/_generated/dataModel';
import { useWorkflowStore, useWorkflowMutations, useWorkflows } from './store/useWorkflowStore';
import NodeCanvas from './components/NodeCanvas';
import SettingsModal from './components/SettingsModal';
import WorkflowList from './components/WorkflowList';
import SharedWorkflowList from './components/SharedWorkflowList';
import ShareWorkflowModal from './components/ShareWorkflowModal';
import ExportModal from './components/ExportModal';
import CommentPanel from './components/CommentPanel';
import OutputPanel from './components/OutputPanel';
import { Node, Edge, AppSettings, NodeType } from './types';
import { IconSettings, IconPlay, IconMessageSquare, IconCpu, IconMonitor, IconLogOut, IconAlertCircle, IconCheck, IconUsers, IconShare2, IconDownload, IconGitBranch, IconCode, IconRepeat, IconLayers, IconVariable, IconGlobe, IconBell } from './components/Icons';
import NotificationBell from './components/NotificationBell';
import { useAuth } from './hooks/useAuth';

export default function App() {
  // Removido useConvexAuth temporariamente até autenticação estar configurada
  const { currentWorkflow, setCurrentWorkflowId } = useWorkflowStore();
  const { updateWorkflow, createWorkflow } = useWorkflowMutations();
  const updateWorkflowWithJsonNodes = useMutation(api.workflows.updateWorkflowWithJsonNodes);
  const executeWorkflowAction = useAction(api.openrouter.executeWorkflow);
  
  // Carregar workflows no store (necessário para restaurar workflow após reload)
  useWorkflows();
  
  const [showWorkflowList, setShowWorkflowList] = useState(!currentWorkflow);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({ openRouterKey: '', theme: 'dark' });
  const [isSimulating, setIsSimulating] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [commentNodeId, setCommentNodeId] = useState<string | null>(null);
  const [outputPanel, setOutputPanel] = useState<{ nodeId: string; result: any; nodeLabel?: string } | null>(null);
  const [showSharedList, setShowSharedList] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, logout } = useAuth();
  const preventAutoSaveRef = useRef(false); // Flag para prevenir auto-save após reload
  
  // Validar workflow
  const validationResult = useQuery(api.workflowValidation.validateWorkflow, {
    nodes,
    edges,
  });

  // Obter workflows do store para verificar se já foram carregados
  const workflows = useWorkflowStore((state) => state.workflows);

  // Restaurar workflowId após reload (ex: após autorização GitHub)
  useEffect(() => {
    const pendingWorkflowId = localStorage.getItem('pendingWorkflowId');
    if (pendingWorkflowId) {
      // Prevenir auto-save imediatamente após reload
      preventAutoSaveRef.current = true;
      
      // Aguardar workflows carregarem
      if (workflows.length > 0) {
        // Verificar se o workflow existe na lista
        const workflowExists = workflows.some(w => w._id === pendingWorkflowId);
        if (workflowExists) {
          // Limpar do localStorage imediatamente para evitar loops
          localStorage.removeItem('pendingWorkflowId');
          // Restaurar o workflowId
          setCurrentWorkflowId(pendingWorkflowId as Id<'workflows'>);
          setShowWorkflowList(false);
          
          // Permitir auto-save após 3 segundos (tempo suficiente para carregar nodes)
          setTimeout(() => {
            preventAutoSaveRef.current = false;
          }, 3000);
        } else {
          // Se o workflow não existe mais, limpar do localStorage
          localStorage.removeItem('pendingWorkflowId');
          preventAutoSaveRef.current = false;
        }
      }
      // Se workflows ainda não carregaram, manter o pendingWorkflowId e tentar novamente quando carregarem
    }
  }, [workflows, currentWorkflow, setCurrentWorkflowId]); // Executar quando workflows forem carregados

  // Carregar workflow atual
  useEffect(() => {
    if (currentWorkflow) {
      // Prevenir auto-save durante o carregamento inicial
      preventAutoSaveRef.current = true;
      
      // Carregar nodes e edges do workflow
      const workflowNodes = currentWorkflow.nodes || [];
      const workflowEdges = currentWorkflow.edges || [];
      
      // Validar e limpar nodes antes de definir
      const validNodes = workflowNodes.filter(node => {
        // Garantir que node tem estrutura válida
        const isValid = node && 
               typeof node.id === 'string' && 
               node.id.length > 0 &&
               typeof node.type === 'string' &&
               node.position &&
               typeof node.position.x === 'number' &&
               typeof node.position.y === 'number';
        
        // Log detalhado para nodes inválidos (especialmente GitHub)
        if (!isValid && node?.type === 'github-repo') {
          console.error('⚠️ Node GitHub inválido detectado:', {
            id: node?.id,
            type: node?.type,
            hasPosition: !!node?.position,
            position: node?.position
          });
        }
        
        return isValid;
      });
      
      // Log para debug se nodes foram filtrados
      if (validNodes.length !== workflowNodes.length) {
        const filteredNodes = workflowNodes.filter(node => {
          const isValid = node && 
                 typeof node.id === 'string' && 
                 node.id.length > 0 &&
                 typeof node.type === 'string' &&
                 node.position &&
                 typeof node.position.x === 'number' &&
                 typeof node.position.y === 'number';
          return !isValid;
        });
        
        console.warn(`⚠️ ${workflowNodes.length - validNodes.length} node(s) inválido(s) foram filtrados ao carregar workflow:`, 
          filteredNodes.map(n => ({ id: n?.id, type: n?.type }))
        );
      }
      
      // Garantir que todos os nodes GitHub foram preservados
      const githubNodesInOriginal = workflowNodes.filter(n => n?.type === 'github-repo');
      const githubNodesInValid = validNodes.filter(n => n?.type === 'github-repo');
      if (githubNodesInOriginal.length !== githubNodesInValid.length) {
        console.error('❌ ERRO: Nodes GitHub foram removidos durante validação!', {
          original: githubNodesInOriginal.length,
          valid: githubNodesInValid.length,
          removed: githubNodesInOriginal.filter(n => !validNodes.some(v => v.id === n.id))
        });
      }
      
      setNodes(validNodes);
      setEdges(workflowEdges || []);
      
      const workflowSettings = currentWorkflow.settings || { openRouterKey: '', theme: 'dark' };
      setSettings({
        openRouterKey: workflowSettings.openRouterKey || '',
        theme: workflowSettings.theme || 'dark',
      });
      
      // Fechar lista quando workflow é carregado
      setShowWorkflowList(false);
      
      // Permitir auto-save após 2 segundos (tempo para nodes serem renderizados)
      setTimeout(() => {
        preventAutoSaveRef.current = false;
      }, 2000);
    } else {
      // Se não há workflow, verificar se há pendingWorkflowId antes de mostrar lista
      const pendingWorkflowId = localStorage.getItem('pendingWorkflowId');
      if (!pendingWorkflowId && !showWorkflowList) {
        // Só mostrar lista se não houver pendingWorkflowId aguardando restauração
        setShowWorkflowList(true);
      }
    }
  }, [currentWorkflow, showWorkflowList]);

  // Auto-save com debounce
  const saveWorkflow = useCallback(async () => {
    if (!currentWorkflow) return;

    // Prevenir auto-save se estiver bloqueado (ex: após reload)
    if (preventAutoSaveRef.current) {
      console.log('⏸️ Auto-save bloqueado temporariamente (após reload)');
      return;
    }

    // Não tentar salvar se não houver nodes ou edges válidos
    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      console.warn('Nodes ou edges não são arrays válidos, pulando save');
      return;
    }

    setSaveStatus('saving');
    try {
      // Normalizar settings para garantir valores válidos antes de enviar
      // Garantir que openRouterKey é sempre string (não null, não undefined)
      const openRouterKeyValue = settings?.openRouterKey;
      const normalizedOpenRouterKey = (openRouterKeyValue === null || openRouterKeyValue === undefined) 
        ? '' 
        : String(openRouterKeyValue);
      
      // Garantir que theme é sempre 'dark' ou 'light'
      const themeValue = settings?.theme;
      const normalizedTheme = (themeValue === 'dark' || themeValue === 'light') 
        ? themeValue 
        : 'dark';
      
      const normalizedSettings = {
        openRouterKey: normalizedOpenRouterKey,
        theme: normalizedTheme,
      };

      // Validar e limpar nodes/edges para garantir serialização
      // Usar JSON.parse(JSON.stringify()) para garantir serialização completa e remover referências
      let cleanNodes: Node[] | undefined = undefined;
      let cleanEdges: Edge[] | undefined = undefined;
      
      if (nodes && Array.isArray(nodes) && nodes.length > 0) {
        try {
          // Usar serialização JSON completa para garantir que tudo é serializável
          const serialized = JSON.stringify(nodes);
          cleanNodes = JSON.parse(serialized);
          // Validar que o resultado é um array válido
          if (!Array.isArray(cleanNodes)) {
            throw new Error('Serialização de nodes não retornou um array');
          }
          // Validar estrutura de cada node para garantir compatibilidade com Convex
          // CRIAR estrutura mínima e limpa para evitar problemas de validação
          const minimalNodes: any[] = [];
          for (const node of cleanNodes) {
            // Criar node mínimo apenas com campos essenciais
            const minimalNode: any = {
              id: String(node.id || ''),
              type: String(node.type || ''),
              position: {
                x: typeof node.position?.x === 'number' ? node.position.x : 0,
                y: typeof node.position?.y === 'number' ? node.position.y : 0
              },
              data: {},
              inputs: Array.isArray(node.inputs) ? node.inputs.map(String) : [],
              outputs: Array.isArray(node.outputs) ? node.outputs.map(String) : []
            };
            
            // Copiar apenas campos primitivos de node.data
            if (node.data && typeof node.data === 'object') {
              for (const key in node.data) {
                const value = node.data[key];
                // Só incluir valores primitivos (string, number, boolean)
                // REMOVER completamente objetos e arrays aninhados
                if (value !== undefined && value !== null && typeof value !== 'function') {
                  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                    minimalNode.data[key] = value;
                  }
                  // Ignorar objetos e arrays - não incluir em node.data
                }
              }
            }
            
            // Garantir que label sempre existe
            if (!minimalNode.data.label) {
              minimalNode.data.label = String(node.data?.label || '');
            }
            
            minimalNodes.push(minimalNode);
          }
          // Substituir cleanNodes pela versão mínima
          cleanNodes = minimalNodes;
        } catch (e) {
          console.error('Erro ao serializar nodes:', e);
          // Se falhar, não enviar nodes (deixar como está no banco)
          cleanNodes = undefined;
        }
      } else if (nodes && Array.isArray(nodes) && nodes.length === 0) {
        // Array vazio - não enviar (deixar como está no banco)
        cleanNodes = undefined;
      } else if (nodes === undefined || nodes === null) {
        // Se nodes é undefined/null, não enviar (deixar como está no banco)
        cleanNodes = undefined;
      } else {
        // Se não é array válido, não enviar
        console.warn('Nodes não é um array válido:', typeof nodes);
        cleanNodes = undefined;
      }
      
      if (edges && Array.isArray(edges) && edges.length > 0) {
        try {
          // Usar serialização JSON completa para garantir que tudo é serializável
          const serialized = JSON.stringify(edges);
          cleanEdges = JSON.parse(serialized);
          // Validar que o resultado é um array válido
          if (!Array.isArray(cleanEdges)) {
            throw new Error('Serialização de edges não retornou um array');
          }
          // Validar estrutura de cada edge para garantir compatibilidade com Convex
          for (const edge of cleanEdges) {
            // Garantir que id é string
            if (edge.id !== undefined && typeof edge.id !== 'string') {
              edge.id = String(edge.id);
            }
            // Garantir que source é string
            if (edge.source !== undefined && typeof edge.source !== 'string') {
              edge.source = String(edge.source);
            }
            // Garantir que target é string
            if (edge.target !== undefined && typeof edge.target !== 'string') {
              edge.target = String(edge.target);
            }
            // Garantir que sourceHandle e targetHandle são strings (ou undefined)
            if (edge.sourceHandle !== undefined && typeof edge.sourceHandle !== 'string') {
              edge.sourceHandle = String(edge.sourceHandle);
            }
            if (edge.targetHandle !== undefined && typeof edge.targetHandle !== 'string') {
              edge.targetHandle = String(edge.targetHandle);
            }
          }
        } catch (e) {
          console.error('Erro ao serializar edges:', e);
          // Se falhar, não enviar edges (deixar como está no banco)
          cleanEdges = undefined;
        }
      } else if (edges && Array.isArray(edges) && edges.length === 0) {
        // Array vazio - não enviar (deixar como está no banco)
        cleanEdges = undefined;
      } else if (edges === undefined || edges === null) {
        // Se edges é undefined/null, não enviar (deixar como está no banco)
        cleanEdges = undefined;
      } else {
        // Se não é array válido, não enviar
        console.warn('Edges não é um array válido:', typeof edges);
        cleanEdges = undefined;
      }

      // Preparar argumentos - só incluir se não forem undefined
      // IMPORTANTE: O Convex pode rejeitar se enviarmos campos com valores inválidos
      const updateArgs: any = {
        id: currentWorkflow._id,
      };
      
      // Incluir settings apenas se tiver a estrutura correta
      // Como settings é opcional na mutation, só enviar se válido
      if (normalizedSettings && 
          typeof normalizedSettings.openRouterKey === 'string' && 
          (normalizedSettings.theme === 'dark' || normalizedSettings.theme === 'light')) {
        updateArgs.settings = normalizedSettings;
      }
      // Se settings inválido, não enviar (deixar como está no banco)
      // O backend vai usar os settings atuais do workflow
      
      // Só incluir nodes/edges se não forem arrays vazios
      // Arrays vazios podem causar problemas na validação do Convex
      if (cleanNodes !== undefined && cleanNodes.length > 0) {
        updateArgs.nodes = cleanNodes;
      }
      if (cleanEdges !== undefined && cleanEdges.length > 0) {
        updateArgs.edges = cleanEdges;
      }

      try {
        // SEMPRE usar mutation alternativa que recebe JSON string
        // Isso contorna problemas de validação do Convex com v.array(v.any())
        const alternativeArgs: any = {
          id: updateArgs.id,
        };
        
        // Incluir nodesJson apenas se houver nodes (não enviar se vazio)
        if (updateArgs.nodes !== undefined && Array.isArray(updateArgs.nodes) && updateArgs.nodes.length > 0) {
          alternativeArgs.nodesJson = JSON.stringify(updateArgs.nodes);
        } else if (updateArgs.nodes !== undefined && Array.isArray(updateArgs.nodes) && updateArgs.nodes.length === 0) {
          // Se nodes é array vazio, enviar como string "[]"
          alternativeArgs.nodesJson = '[]';
        }
        // Se nodes é undefined, não incluir nodesJson (será undefined no backend)
        
        // Incluir edgesJson apenas se houver edges (não enviar se vazio)
        if (updateArgs.edges !== undefined && Array.isArray(updateArgs.edges) && updateArgs.edges.length > 0) {
          alternativeArgs.edgesJson = JSON.stringify(updateArgs.edges);
        } else if (updateArgs.edges !== undefined && Array.isArray(updateArgs.edges) && updateArgs.edges.length === 0) {
          // Se edges é array vazio, enviar como string "[]"
          alternativeArgs.edgesJson = '[]';
        }
        // Se edges é undefined, não incluir edgesJson (será undefined no backend)
        
        // Incluir settings se fornecido - GARANTIR estrutura válida
        if (updateArgs.settings !== undefined) {
          // Validar e normalizar settings antes de enviar
          const validSettings = {
            openRouterKey: typeof updateArgs.settings.openRouterKey === 'string' 
              ? updateArgs.settings.openRouterKey 
              : '',
            theme: (updateArgs.settings.theme === 'dark' || updateArgs.settings.theme === 'light')
              ? updateArgs.settings.theme
              : 'dark'
          };
          alternativeArgs.settings = validSettings;
        }

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a7576830-f069-47f1-89e2-c0c545ca634b', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'A',location:'App.tsx:beforeMutationCall',message:'Before calling updateWorkflowWithJsonNodes',data:{alternativeArgsKeys:Object.keys(alternativeArgs),nodesJsonType:typeof alternativeArgs.nodesJson,nodesJsonLength:alternativeArgs.nodesJson?.length,edgesJsonType:typeof alternativeArgs.edgesJson,edgesJsonLength:alternativeArgs.edgesJson?.length,hasSettings:!!alternativeArgs.settings,settingsType:typeof alternativeArgs.settings,settingsKeys:alternativeArgs.settings?Object.keys(alternativeArgs.settings):null,alternativeArgsStringified:JSON.stringify(alternativeArgs).substring(0,2000)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        
        console.log('[DEBUG FRONTEND] About to call updateWorkflowWithJsonNodes with:', {
          keys: Object.keys(alternativeArgs),
          nodesJsonType: typeof alternativeArgs.nodesJson,
          nodesJsonLength: alternativeArgs.nodesJson?.length,
          edgesJsonType: typeof alternativeArgs.edgesJson,
          edgesJsonLength: alternativeArgs.edgesJson?.length,
          hasSettings: !!alternativeArgs.settings,
          settingsType: typeof alternativeArgs.settings,
          settingsKeys: alternativeArgs.settings ? Object.keys(alternativeArgs.settings) : null,
          settingsValue: alternativeArgs.settings,
          fullArgs: alternativeArgs
        });

        if (!updateWorkflowWithJsonNodes) {
          // Fallback para mutation normal se alternativa não estiver disponível
          await updateWorkflow(updateArgs);
          return;
        }

        await updateWorkflowWithJsonNodes(alternativeArgs);
      } catch (callError: any) {
        // Log detalhado do erro para debug
        console.error('[ERROR] Erro ao chamar updateWorkflowWithJsonNodes:', {
          error: callError,
          message: callError?.message,
          stack: callError?.stack,
          alternativeArgs: {
            ...alternativeArgs,
            nodesJson: alternativeArgs.nodesJson?.substring(0, 200) + '...',
            edgesJson: alternativeArgs.edgesJson?.substring(0, 200) + '...',
          }
        });
        throw callError;
      }

      setSaveStatus('saved');
      // Resetar para idle após 2 segundos
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error: any) {
      console.error('Error saving workflow:', error);
      setSaveStatus('error');
      
      // Não limpar o workflow atual em caso de erro - manter os dados na memória
      // O usuário pode tentar salvar novamente ou fazer outras alterações
      
      // Se o erro for relacionado a workflow não encontrado, não tentar salvar novamente
      if (error?.message?.includes('not found') || error?.message?.includes('Workflow not found')) {
        console.warn('⚠️ Workflow não encontrado, parando tentativas de save');
        preventAutoSaveRef.current = true;
      }
      
      // Resetar para idle após 3 segundos em caso de erro
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  }, [currentWorkflow, nodes, edges, settings, updateWorkflow, updateWorkflowWithJsonNodes]);

  useEffect(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    if (currentWorkflow) {
      const timeout = setTimeout(() => {
        saveWorkflow();
      }, 2000); // Debounce de 2 segundos

      setSaveTimeout(timeout);
    }

    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [nodes, edges, settings, currentWorkflow, saveWorkflow]);

  const addNode = (type: NodeType) => {
    const id = `${Date.now()}`;
    
    let label = 'Novo Nó';
    let inputs: string[] = ['input'];
    let outputs: string[] = ['output'];
    
    if (type === 'input-text') {
      label = 'Prompt de Texto';
      inputs = [];
      outputs = ['output'];
    } else if (type === 'github-repo') {
      label = 'Conexão GitHub';
      inputs = [];
      outputs = ['output'];
    } else if (type === 'llm-model') {
      label = 'Processador LLM';
      inputs = ['input'];
      outputs = ['output'];
    } else if (type === 'output-display') {
      label = 'Resultado';
      inputs = ['input'];
      outputs = [];
    } else if (type === 'conditional') {
      label = 'Condicional';
      inputs = ['input'];
      outputs = ['true', 'false'];
    } else if (type === 'transform') {
      label = 'Transformação';
      inputs = ['input'];
      outputs = ['output'];
    } else if (type === 'variable') {
      label = 'Variável';
      inputs = ['input'];
      outputs = ['output'];
    } else if (type === 'loop') {
      label = 'Loop';
      inputs = ['input', 'items'];
      outputs = ['output', 'item'];
    } else if (type === 'aggregate') {
      label = 'Agregação';
      inputs = ['input1', 'input2', 'input3'];
      outputs = ['output'];
    }

    // Garantir que data seja um objeto válido e serializável
    const nodeData: any = { label };
    
    // Inicializar dados específicos do tipo GitHub
    if (type === 'github-repo') {
      nodeData.githubRepo = '';
      nodeData.githubBranch = 'main';
      nodeData.githubPath = '';
      nodeData.githubSearchQuery = '';
      nodeData.githubMode = 'list';
    }

    const newNode: Node = {
      id,
      type,
      position: { x: 100 + Math.random() * 50, y: 100 + Math.random() * 50 },
      data: nodeData,
      inputs,
      outputs
    };
    setNodes([...nodes, newNode]);
  };

  const duplicateNode = (nodeId: string) => {
    const nodeToDuplicate = nodes.find(n => n.id === nodeId);
    if (!nodeToDuplicate) return;

    const newId = `${nodeToDuplicate.id}-copy-${Date.now()}`;
    const newNode: Node = {
      ...nodeToDuplicate,
      id: newId,
      position: {
        x: nodeToDuplicate.position.x + 30,
        y: nodeToDuplicate.position.y + 30
      },
      data: {
        ...nodeToDuplicate.data,
        label: `${nodeToDuplicate.data.label} (Cópia)`
      }
    };

    setNodes(prev => [...prev, newNode]);
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setEdges(edges.filter(e => e.source !== nodeId && e.target !== nodeId));
  };

  const handleRun = async () => {
    if (!currentWorkflow) {
      alert("Por favor, selecione ou crie um workflow primeiro.");
      return;
    }

    if (!settings.openRouterKey || settings.openRouterKey.trim() === '') {
      alert("Por favor, configure sua chave API do OpenRouter no menu de configurações.");
      setIsSettingsOpen(true);
      return;
    }
    
    // Validar workflow antes de executar
    if (validationResult && !validationResult.valid) {
      const errorMessage = validationResult.errors.join('\n');
      alert(`Workflow inválido:\n\n${errorMessage}`);
      return;
    }

    setIsSimulating(true);
    
    // Marcar nós LLM como processando
    setNodes(prev => prev.map(n => 
      n.type === 'llm-model' ? { ...n, data: { ...n.data, isProcessing: true } } : n
    ));

    try {
      const result = await executeWorkflowAction({
        workflowId: currentWorkflow._id,
        nodes,
        edges,
        apiKey: settings.openRouterKey,
      });

      if (result.success) {
        // Atualizar nó de output com resultado
        setNodes(prev => prev.map(n => 
          n.type === 'output-display' ? { 
            ...n, 
            data: { 
              ...n.data, 
              value: result.result || 'Sem resultado' 
            } 
          } : n
        ));
      } else {
        alert(`Erro ao executar workflow: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      alert(`Erro ao executar workflow: ${error}`);
    } finally {
      setNodes(prev => prev.map(n => 
        n.type === 'llm-model' ? { ...n, data: { ...n.data, isProcessing: false } } : n
      ));
      setIsSimulating(false);
    }
  };

  const handleSelectWorkflow = (workflowId: Id<'workflows'>) => {
    setCurrentWorkflowId(workflowId);
    setShowWorkflowList(false);
  };

  const handleBackToWorkflows = () => {
    // Marcar para pular auto-seleção ANTES de limpar o workflow
    useWorkflowStore.setState({ skipAutoSelect: true });
    setShowWorkflowList(true);
    setCurrentWorkflowId(null);
    setNodes([]);
    setEdges([]);
  };

  const handleCreateWorkflow = async () => {
    try {
      const workflowId = await createWorkflow({
        name: 'Novo Workflow',
        description: '',
        nodes: [],
        edges: [],
        settings: {
          openRouterKey: settings.openRouterKey || '',
          theme: settings.theme || 'dark',
        },
      });
      setCurrentWorkflowId(workflowId);
      setShowWorkflowList(false);
    } catch (error) {
      console.error('Erro ao criar workflow:', error);
      alert('Erro ao criar workflow. Tente novamente.');
    }
  };

  if (showWorkflowList) {
    return <WorkflowList onSelectWorkflow={handleSelectWorkflow} onCreateWorkflow={handleCreateWorkflow} />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background text-zinc-100">
      {/* Header */}
      <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToWorkflows}
              className="flex items-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Voltar para workflows"
            >
              <span className="text-lg">←</span>
              <span className="text-sm font-medium">Workflows</span>
            </button>
            <button
              onClick={() => setShowSharedList(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Workflows compartilhados"
            >
              <IconUsers className="w-4 h-4" />
            </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="font-bold text-white">N</span>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">
              {currentWorkflow?.name || 'NodeGen Studio'}
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">OpenRouter Integration</p>
          </div>
          {saveStatus !== 'idle' && (
            <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${
              saveStatus === 'saving' ? 'text-blue-400 bg-blue-500/10' :
              saveStatus === 'saved' ? 'text-emerald-400 bg-emerald-500/10' :
              'text-red-400 bg-red-500/10'
            }`}>
              {saveStatus === 'saving' && (
                <>
                  <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Salvando...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <IconCheck className="w-3 h-3" />
                  <span>Salvo</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <IconAlertCircle className="w-3 h-3" />
                  <span>Erro ao salvar</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {currentWorkflow && (
            <div className="flex items-center gap-3">
              {validationResult && !validationResult.valid && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <IconAlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-400 font-medium">
                    {validationResult.errors.length} erro(s)
                  </span>
                </div>
              )}
              {validationResult && validationResult.warnings.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <IconAlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-medium">
                    {validationResult.warnings.length} aviso(s)
                  </span>
                </div>
              )}
              <button 
                onClick={handleRun}
                disabled={isSimulating || !currentWorkflow || (validationResult && !validationResult.valid)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold transition-all shadow-lg shadow-primary/20
                  ${isSimulating || (validationResult && !validationResult.valid) 
                    ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
                    : 'bg-primary hover:bg-indigo-600 text-white'
                  }
                `}
              >
                {isSimulating ? (
                  <>Processing...</>
                ) : (
                  <><IconPlay className="w-4 h-4" /> Executar Workflow</>
                )}
              </button>
            </div>
          )}
          
            <button
              onClick={() => setShowExportModal(true)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Exportar workflow"
              disabled={!currentWorkflow}
            >
              <IconDownload className="w-5 h-5" />
            </button>

            <NotificationBell />
            
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <IconSettings className="w-5 h-5" />
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Tools */}
        <aside className="w-16 border-r border-border bg-surface z-10 flex flex-col items-center py-6 gap-6">
          <div className="group relative flex items-center justify-center">
            <button 
              onClick={() => addNode('input-text')}
              className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-emerald-500/20 hover:text-emerald-400 border border-transparent hover:border-emerald-500/50 flex items-center justify-center transition-all duration-300 shadow-md"
            >
              <IconMessageSquare className="w-5 h-5" />
            </button>
            <span className="absolute left-14 bg-zinc-900 text-xs text-zinc-200 px-2 py-1.5 rounded-md border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-50">
              Prompt de Texto
            </span>
          </div>

          <div className="group relative flex items-center justify-center">
            <button 
              onClick={() => addNode('github-repo')}
              className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-blue-500/20 hover:text-blue-400 border border-transparent hover:border-blue-500/50 flex items-center justify-center transition-all duration-300 shadow-md"
            >
              <IconCode className="w-5 h-5" />
            </button>
            <span className="absolute left-14 bg-zinc-900 text-xs text-zinc-200 px-2 py-1.5 rounded-md border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-50">
              Conexão GitHub
            </span>
          </div>

          <div className="group relative flex items-center justify-center">
            <button 
              onClick={() => addNode('llm-model')}
              className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-primary/20 hover:text-primary border border-transparent hover:border-primary/50 flex items-center justify-center transition-all duration-300 shadow-md"
            >
              <IconCpu className="w-5 h-5" />
            </button>
            <span className="absolute left-14 bg-zinc-900 text-xs text-zinc-200 px-2 py-1.5 rounded-md border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-50">
              Modelo IA
            </span>
          </div>

            <div className="group relative flex items-center justify-center">
              <button
                onClick={() => addNode('output-display')}
                className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-accent/20 hover:text-accent border border-transparent hover:border-accent/50 flex items-center justify-center transition-all duration-300 shadow-md"
              >
                <IconMonitor className="w-5 h-5" />
              </button>
              <span className="absolute left-14 bg-zinc-900 text-xs text-zinc-200 px-2 py-1.5 rounded-md border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-50">
                Resultado
              </span>
            </div>

            <div className="w-full h-px bg-border my-2"></div>

            <div className="group relative flex items-center justify-center">
              <button
                onClick={() => addNode('conditional')}
                className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-yellow-500/20 hover:text-yellow-400 border border-transparent hover:border-yellow-500/50 flex items-center justify-center transition-all duration-300 shadow-md"
              >
                <IconGitBranch className="w-5 h-5" />
              </button>
              <span className="absolute left-14 bg-zinc-900 text-xs text-zinc-200 px-2 py-1.5 rounded-md border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-50">
                Condicional
              </span>
            </div>

            <div className="group relative flex items-center justify-center">
              <button
                onClick={() => addNode('transform')}
                className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-purple-500/20 hover:text-purple-400 border border-transparent hover:border-purple-500/50 flex items-center justify-center transition-all duration-300 shadow-md"
              >
                <IconCode className="w-5 h-5" />
              </button>
              <span className="absolute left-14 bg-zinc-900 text-xs text-zinc-200 px-2 py-1.5 rounded-md border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-50">
                Transformação
              </span>
            </div>

            <div className="group relative flex items-center justify-center">
              <button
                onClick={() => addNode('variable')}
                className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-cyan-500/20 hover:text-cyan-400 border border-transparent hover:border-cyan-500/50 flex items-center justify-center transition-all duration-300 shadow-md"
              >
                <IconVariable className="w-5 h-5" />
              </button>
              <span className="absolute left-14 bg-zinc-900 text-xs text-zinc-200 px-2 py-1.5 rounded-md border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-50">
                Variável
              </span>
            </div>

            <div className="group relative flex items-center justify-center">
              <button
                onClick={() => addNode('loop')}
                className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-orange-500/20 hover:text-orange-400 border border-transparent hover:border-orange-500/50 flex items-center justify-center transition-all duration-300 shadow-md"
              >
                <IconRepeat className="w-5 h-5" />
              </button>
              <span className="absolute left-14 bg-zinc-900 text-xs text-zinc-200 px-2 py-1.5 rounded-md border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-50">
                Loop
              </span>
            </div>

            <div className="group relative flex items-center justify-center">
              <button
                onClick={() => addNode('aggregate')}
                className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-teal-500/20 hover:text-teal-400 border border-transparent hover:border-teal-500/50 flex items-center justify-center transition-all duration-300 shadow-md"
              >
                <IconLayers className="w-5 h-5" />
              </button>
              <span className="absolute left-14 bg-zinc-900 text-xs text-zinc-200 px-2 py-1.5 rounded-md border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-50">
                Agregação
              </span>
            </div>

            <div className="w-full h-px bg-border my-2"></div>

            <div className="group relative flex items-center justify-center">
              <button
                onClick={() => addNode('http-request')}
                className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-blue-500/20 hover:text-blue-400 border border-transparent hover:border-blue-500/50 flex items-center justify-center transition-all duration-300 shadow-md"
              >
                <IconGlobe className="w-5 h-5" />
              </button>
              <span className="absolute left-14 bg-zinc-900 text-xs text-zinc-200 px-2 py-1.5 rounded-md border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-50">
                HTTP Request
              </span>
            </div>
          </aside>

        {/* Main Canvas */}
        <main className="flex-1 relative flex">
          <div className="flex-1 relative">
            <NodeCanvas 
              nodes={nodes} 
              edges={edges}
              workflowId={currentWorkflow?._id}
              setNodes={setNodes}
              setEdges={setEdges}
              onDeleteNode={deleteNode}
              onDuplicateNode={duplicateNode}
              isSimulating={isSimulating}
              onOpenComments={setCommentNodeId}
              onOpenOutput={(nodeId, result) => {
                const node = nodes.find(n => n.id === nodeId);
                setOutputPanel({ nodeId, result, nodeLabel: node?.data.label });
              }}
            />
            
            <div className="absolute bottom-4 right-4 bg-surface/80 backdrop-blur border border-border p-2 rounded-lg text-xs text-zinc-500 pointer-events-none select-none">
              Double click title to edit • Select to see actions
            </div>
          </div>
          
          {commentNodeId && currentWorkflow && (
            <CommentPanel
              workflowId={currentWorkflow._id}
              nodeId={commentNodeId}
              onClose={() => setCommentNodeId(null)}
            />
          )}
        </main>
        
        {outputPanel && (
          <OutputPanel
            result={outputPanel.result}
            nodeLabel={outputPanel.nodeLabel}
            onClose={() => setOutputPanel(null)}
          />
        )}
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings);
          if (currentWorkflow) {
            updateWorkflow({
              id: currentWorkflow._id,
              settings: newSettings,
            });
          }
        }}
      />

      {currentWorkflow && (
        <>
          <ShareWorkflowModal
            isOpen={showShareModal}
            onClose={() => {
              setShowShareModal(false);
            }}
            workflowId={currentWorkflow._id}
          />
          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            workflow={{
              _id: currentWorkflow._id,
              name: currentWorkflow.name,
              description: currentWorkflow.description,
              nodes,
              edges,
              settings,
            }}
            canvasElement={canvasRef.current || undefined}
          />
        </>
      )}

      {showSharedList && (
        <SharedWorkflowList
          onSelectWorkflow={handleSelectWorkflow}
          onClose={() => setShowSharedList(false)}
        />
      )}
    </div>
  );
}
