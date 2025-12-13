import React, { useState } from 'react';
import NodeCanvas from './components/NodeCanvas';
import SettingsModal from './components/SettingsModal';
import { Node, Edge, AppSettings, NodeType } from './types';
import { IconSettings, IconPlay, IconMessageSquare, IconGithub, IconCpu, IconMonitor } from './components/Icons';

const INITIAL_NODES: Node[] = [
  {
    id: '1',
    type: 'input-text',
    position: { x: 100, y: 100 },
    data: { label: 'Entrada de Texto', value: 'Escreva um poema sobre IA e Cyberpunk.' },
    inputs: [],
    outputs: ['output']
  },
  {
    id: '2',
    type: 'llm-model',
    position: { x: 500, y: 150 },
    data: { label: 'Processador LLM', model: 'openai/gpt-4o' },
    inputs: ['input'],
    outputs: ['output']
  },
  {
    id: '3',
    type: 'output-display',
    position: { x: 900, y: 200 },
    data: { label: 'Display Final', value: '' },
    inputs: ['input'],
    outputs: []
  }
];

const INITIAL_EDGES: Edge[] = [
  { id: 'e1-2', source: '1', sourceHandle: 'output', target: '2', targetHandle: 'input' },
  { id: 'e2-3', source: '2', sourceHandle: 'output', target: '3', targetHandle: 'input' }
];

export default function App() {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({ openRouterKey: '', theme: 'dark' });
  const [isSimulating, setIsSimulating] = useState(false);

  const addNode = (type: NodeType) => {
    const id = `${Date.now()}`; // ID único baseado no tempo
    
    let label = 'Novo Nó';
    if (type === 'input-text') label = 'Prompt de Texto';
    if (type === 'github-repo') label = 'GitHub Repo';
    if (type === 'llm-model') label = 'Processador LLM';
    if (type === 'output-display') label = 'Resultado';

    const newNode: Node = {
      id,
      type,
      position: { x: 100 + Math.random() * 50, y: 100 + Math.random() * 50 },
      data: { label },
      inputs: type === 'input-text' || type === 'github-repo' ? [] : ['input'],
      outputs: type === 'output-display' ? [] : ['output']
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
        x: nodeToDuplicate.position.x + 30, // Ligeiro deslocamento para não sobrepor
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
    // Remove o nó
    setNodes(nodes.filter(n => n.id !== nodeId));
    // Remove todas as conexões ligadas a este nó
    setEdges(edges.filter(e => e.source !== nodeId && e.target !== nodeId));
  };

  const handleRun = () => {
    // Simulação visual da execução
    if (!settings.openRouterKey) {
      alert("Por favor, configure sua chave API no menu de configurações.");
      setIsSettingsOpen(true);
      return;
    }

    setIsSimulating(true);
    
    // Simular processamento
    setNodes(prev => prev.map(n => n.type === 'llm-model' ? { ...n, data: { ...n.data, isProcessing: true } } : n));

    setTimeout(() => {
      setNodes(prev => prev.map(n => n.type === 'llm-model' ? { ...n, data: { ...n.data, isProcessing: false } } : n));
      setNodes(prev => prev.map(n => n.type === 'output-display' ? { 
        ...n, 
        data: { 
          ...n.data, 
          value: "Resultado gerado com sucesso.\n\nModelo: " + (nodes.find(x => x.type === 'llm-model')?.data.model || 'Unknown') + "\nLatência: 420ms" 
        } 
      } : n));
      
      setIsSimulating(false);
    }, 2500); // Um pouco mais longo para apreciar a animação
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background text-zinc-100">
      
      {/* Header */}
      <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
             <span className="font-bold text-white">N</span>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">NodeGen Studio</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">OpenRouter Integration</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleRun}
            disabled={isSimulating}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold transition-all shadow-lg shadow-primary/20
              ${isSimulating ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-primary hover:bg-indigo-600 text-white'}
            `}
          >
            {isSimulating ? (
              <>Processing...</>
            ) : (
              <><IconPlay className="w-4 h-4" /> Executar Workflow</>
            )}
          </button>
          
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
          
          {/* Tool 1: Prompt de Texto (Green) */}
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

          {/* Tool 2: GitHub Repo (Blue) */}
          <div className="group relative flex items-center justify-center">
            <button 
              onClick={() => addNode('github-repo')}
              className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-blue-500/20 hover:text-blue-400 border border-transparent hover:border-blue-500/50 flex items-center justify-center transition-all duration-300 shadow-md"
            >
              <IconGithub className="w-5 h-5" />
            </button>
            <span className="absolute left-14 bg-zinc-900 text-xs text-zinc-200 px-2 py-1.5 rounded-md border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-50">
              GitHub Repo
            </span>
          </div>

          {/* Tool 3: LLM Processor (Indigo/Primary) */}
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

          {/* Tool 4: Resultado (Pink/Accent) */}
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
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 relative">
          <NodeCanvas 
            nodes={nodes} 
            edges={edges}
            setNodes={setNodes}
            setEdges={setEdges}
            onDeleteNode={deleteNode}
            onDuplicateNode={duplicateNode}
            isSimulating={isSimulating}
          />
          
          <div className="absolute bottom-4 right-4 bg-surface/80 backdrop-blur border border-border p-2 rounded-lg text-xs text-zinc-500 pointer-events-none select-none">
             Double click title to edit • Select to see actions
          </div>
        </main>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onSave={setSettings}
      />
    </div>
  );
}