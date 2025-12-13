import React from 'react';
import { Node } from '../../types';

interface ConditionalNodeProps {
  node: Node;
  onUpdateData: (nodeId: string, data: any) => void;
}

const ConditionalNode: React.FC<ConditionalNodeProps> = ({ node, onUpdateData }) => {
  return (
    <div className="p-3 pt-4 space-y-3">
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Condição</label>
        <input
          type="text"
          className="w-full bg-black/20 border border-border rounded p-2 text-xs text-zinc-200 focus:outline-none focus:border-primary transition-colors"
          placeholder="Ex: valor > 10"
          value={node.data.condition || ''}
          onChange={(e) => onUpdateData(node.id, { condition: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default ConditionalNode;
