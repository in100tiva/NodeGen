import React from 'react';
import { Node } from '../../types';

interface LoopNodeProps {
  node: Node;
  onUpdateData: (nodeId: string, data: any) => void;
}

const LoopNode: React.FC<LoopNodeProps> = ({ node, onUpdateData }) => {
  return (
    <div className="p-3 pt-4 space-y-3">
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Iterações</label>
        <input
          type="number"
          className="w-full bg-black/20 border border-border rounded p-2 text-xs text-zinc-200 focus:outline-none focus:border-primary transition-colors"
          placeholder="10"
          value={node.data.iterations || ''}
          onChange={(e) => onUpdateData(node.id, { iterations: parseInt(e.target.value) || 0 })}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default LoopNode;
