import React from 'react';
import { Node } from '../../types';

interface VariableNodeProps {
  node: Node;
  onUpdateData: (nodeId: string, data: any) => void;
}

const VariableNode: React.FC<VariableNodeProps> = ({ node, onUpdateData }) => {
  return (
    <div className="p-3 pt-4 space-y-3">
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Nome da Variável</label>
        <input
          type="text"
          className="w-full bg-black/20 border border-border rounded p-2 text-xs text-zinc-200 focus:outline-none focus:border-primary transition-colors"
          placeholder="nome_variavel"
          value={node.data.variableName || ''}
          onChange={(e) => onUpdateData(node.id, { variableName: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Valor</label>
        <input
          type="text"
          className="w-full bg-black/20 border border-border rounded p-2 text-xs text-zinc-200 focus:outline-none focus:border-primary transition-colors"
          placeholder="valor"
          value={node.data.value || ''}
          onChange={(e) => onUpdateData(node.id, { value: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default VariableNode;
