import React, { useState, useRef, useEffect } from 'react';
import { Node, NodeType } from '../types';
import { IconBrain, IconGripVertical, IconMessageSquare, IconChevronDown, IconCheck, IconTrash, IconCopy, IconFileImage, IconMonitor, IconCpu } from './Icons';

interface NodeCardProps {
  node: Node;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onHandleMouseDown: (e: React.MouseEvent, nodeId: string, handleId: string, type: 'source' | 'target') => void;
  onHandleMouseUp: (e: React.MouseEvent, nodeId: string, handleId: string, type: 'source' | 'target') => void;
  onUpdateData: (nodeId: string, data: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

// Sub-componente para o Select Customizado
const CustomSelect = ({ 
  value, 
  onChange, 
  options 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { label: string; value: string }[] 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="relative w-full">
      <div 
        className={`
          w-full bg-black/40 border rounded px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-all
          ${isOpen ? 'border-primary ring-1 ring-primary/50' : 'border-zinc-700 hover:border-zinc-500'}
        `}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="text-zinc-200 font-medium truncate pr-2">{selectedOption.label}</span>
        <IconChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }} 
          />
          <div className="absolute top-full mt-1 left-0 w-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl shadow-black/50 z-50 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            {options.map((option) => (
              <div
                key={option.value}
                className={`
                  px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors
                  ${value === option.value ? 'bg-primary/10 text-primary' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(option.value);
                  setIsOpen(false);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <span>{option.label}</span>
                {value === option.value && <IconCheck className="w-3 h-3" />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const NodeCard: React.FC<NodeCardProps> = ({ node, isSelected, onMouseDown, onHandleMouseDown, onHandleMouseUp, onUpdateData, onDelete, onDuplicate }) => {
  
  // Estado para controle de edição do título
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Foca no input quando entra no modo de edição
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    }
  };

  const renderContent = () => {
    switch (node.type) {
      case 'input-text':
        return (
          <div className="p-3 pt-4">
            <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Prompt do Usuário</label>
            <textarea
              className="w-full bg-black/20 border border-border rounded p-2 text-xs text-zinc-200 resize-none focus:outline-none focus:border-primary h-20 transition-colors"
              placeholder="Digite sua mensagem aqui..."
              value={node.data.value || ''}
              onChange={(e) => onUpdateData(node.id, { value: e.target.value })}
              onMouseDown={(e) => e.stopPropagation()} 
            />
          </div>
        );
      
      case 'input-file':
        return (
          <div className="p-3 pt-4">
            <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Upload de Arquivo</label>
            <div className="w-full h-24 border-2 border-dashed border-zinc-700 hover:border-blue-500 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group/upload bg-black/20">
               <IconFileImage className="w-6 h-6 text-zinc-600 group-hover/upload:text-blue-500 transition-colors" />
               <span className="text-[10px] text-zinc-500 group-hover/upload:text-blue-400 font-medium">
                 {node.data.fileName || 'Arraste ou clique'}
               </span>
            </div>
          </div>
        );

      case 'llm-model':
        const modelOptions = [
          { label: 'GPT-4o (OpenAI)', value: 'openai/gpt-4o' },
          { label: 'Claude 3 Opus (Anthropic)', value: 'anthropic/claude-3-opus' },
          { label: 'Llama 3 70B (Meta)', value: 'meta-llama/llama-3-70b' },
          { label: 'Gemini Pro 1.5 (Google)', value: 'google/gemini-pro' }
        ];

        return (
          <div className="p-3 pt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Modelo</label>
              <CustomSelect 
                value={node.data.model || 'openai/gpt-3.5-turbo'}
                options={modelOptions}
                onChange={(val) => onUpdateData(node.id, { model: val })}
              />
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/50 p-2 rounded border border-border/50">
               <div className={`w-2 h-2 rounded-full ${node.data.isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
               <span className="text-[10px] text-zinc-400 font-mono uppercase">
                 {node.data.isProcessing ? 'PROCESSANDO...' : 'AGUARDANDO INPUT'}
               </span>
            </div>
          </div>
        );
      case 'output-display':
        return (
          <div className="p-3 pt-4">
            <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Resultado</label>
            <div className="w-full bg-black/40 border border-border rounded p-2 text-xs text-zinc-300 min-h-[80px] max-h-[150px] overflow-y-auto font-mono whitespace-pre-wrap custom-scrollbar">
              {node.data.value || '// Texto, Imagem ou Vídeo gerado aparecerá aqui...'}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getHeaderColor = () => {
    switch (node.type) {
      case 'input-text': return 'border-emerald-500/50 text-emerald-400';
      case 'input-file': return 'border-blue-500/50 text-blue-400';
      case 'llm-model': return 'border-primary/50 text-primary';
      case 'output-display': return 'border-accent/50 text-accent';
      default: return 'border-zinc-700 text-zinc-400';
    }
  };

  const getIcon = () => {
    switch (node.type) {
      case 'input-text': return <IconMessageSquare className="w-4 h-4" />;
      case 'input-file': return <IconFileImage className="w-4 h-4" />;
      case 'llm-model': return <IconCpu className="w-4 h-4" />;
      case 'output-display': return <IconMonitor className="w-4 h-4" />;
      default: return <IconBrain className="w-4 h-4" />;
    }
  };

  const HANDLE_OFFSET_TOP = 64; 
  const HANDLE_SPACING = 32;

  return (
    <div
      className={`absolute w-64 bg-surface/90 backdrop-blur-md border rounded-xl shadow-xl transition-shadow group z-10 select-none
        ${isSelected ? 'border-primary shadow-primary/20 ring-1 ring-primary/50' : 'border-border hover:border-zinc-600'}
      `}
      style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)` }}
    >
      
      {/* AÇÕES RÁPIDAS */}
      <div 
        className={`absolute left-0 right-0 flex justify-center gap-2 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${isSelected ? '-top-12 opacity-100 scale-100' : 'top-0 opacity-0 scale-0'}
        `}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="pointer-events-auto bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg shadow-red-500/30 flex items-center justify-center transform hover:scale-110 active:scale-95 transition-transform border-2 border-surface"
          title="Deletar Nó"
        >
          <IconTrash className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="pointer-events-auto bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transform hover:scale-110 active:scale-95 transition-transform border-2 border-surface"
          title="Duplicar Nó"
        >
          <IconCopy className="w-4 h-4" />
        </button>
        
        <div className={`absolute bottom-[-4px] w-2 h-2 bg-surface border-t border-l border-surface rotate-45 transform transition-opacity delay-75 duration-300 opacity-0`}></div>
      </div>


      {/* Header */}
      <div
        className={`flex items-center justify-between p-3 border-b ${getHeaderColor()} cursor-grab active:cursor-grabbing rounded-t-xl`}
        onMouseDown={(e) => onMouseDown(e, node.id)}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 flex-1 mr-2 overflow-hidden">
          {getIcon()}
          
          {isEditingTitle ? (
             <input 
             ref={titleInputRef}
             type="text"
             className="font-semibold text-sm bg-black/50 border border-primary/50 rounded px-1 w-full text-white focus:outline-none cursor-text"
             value={node.data.label}
             onChange={(e) => onUpdateData(node.id, { label: e.target.value })}
             onBlur={handleTitleSubmit}
             onKeyDown={handleTitleKeyDown}
             onMouseDown={(e) => e.stopPropagation()} 
           />
          ) : (
            <span 
              className="font-semibold text-sm text-zinc-200 truncate cursor-text hover:text-white transition-colors"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              title="Duplo clique para editar"
            >
              {node.data.label}
            </span>
          )}
         
        </div>
        <IconGripVertical className="w-4 h-4 opacity-50 flex-shrink-0" />
      </div>

      {/* Content */}
      {renderContent()}

      {/* Input Handles */}
      {node.inputs.map((input, index) => (
        <div
          key={input}
          className="absolute flex items-center justify-center cursor-crosshair group/handle"
          style={{ 
            top: `${HANDLE_OFFSET_TOP + (index * HANDLE_SPACING)}px`,
            left: '-24px', 
            width: '24px', 
            height: '24px' 
          }}
          onMouseDown={(e) => onHandleMouseDown(e, node.id, input, 'target')}
          onMouseUp={(e) => onHandleMouseUp(e, node.id, input, 'target')}
        >
            {/* Área invisível aumentada para facilitar o click/snap */}
            <div className="absolute -inset-4 rounded-full z-0"></div>

            <div className="relative z-10 w-3 h-3 bg-zinc-900 border-2 border-zinc-400 rounded-full group-hover/handle:border-white group-hover/handle:scale-125 transition-all shadow-sm flex items-center justify-center">
              <div className="w-1 h-1 bg-zinc-500 rounded-full group-hover/handle:bg-primary transition-colors"></div>
            </div>
            
            <div className="absolute left-full ml-1 text-[10px] text-zinc-500 opacity-0 group-hover/handle:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-black/50 px-1 rounded z-20">
              Input
            </div>
        </div>
      ))}

      {/* Output Handles */}
      {node.outputs.map((output, index) => (
        <div
          key={output}
          className="absolute flex items-center justify-center cursor-crosshair group/handle"
          style={{ 
            top: `${HANDLE_OFFSET_TOP + (index * HANDLE_SPACING)}px`,
            right: '-24px', 
            width: '24px', 
            height: '24px' 
          }}
          onMouseDown={(e) => onHandleMouseDown(e, node.id, output, 'source')}
          onMouseUp={(e) => onHandleMouseUp(e, node.id, output, 'source')}
        >
           {/* Área invisível aumentada para facilitar o click/snap */}
           <div className="absolute -inset-4 rounded-full z-0"></div>

           <div className="relative z-10 w-3 h-3 bg-zinc-900 border-2 border-indigo-500 rounded-full group-hover/handle:border-white group-hover/handle:scale-125 transition-all shadow-sm flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.3)]">
              <div className="w-1 h-1 bg-indigo-400 rounded-full group-hover/handle:bg-white transition-colors"></div>
           </div>

           <div className="absolute right-full mr-1 text-[10px] text-zinc-500 opacity-0 group-hover/handle:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-black/50 px-1 rounded z-20">
            Output
          </div>
        </div>
      ))}
    </div>
  );
};

export default NodeCard;